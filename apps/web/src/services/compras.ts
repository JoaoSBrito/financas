import { z } from "zod";
import {
  hojeEmSaoPaulo,
  parcelamentoEmAndamento,
  simularCompra,
  type NovoGasto,
  type ParcelamentoEmAndamento,
  type SaldoInicialFatura,
} from "@financas/core";
import { supabaseNavegador } from "@/lib/supabase/client";
import { ErroDeDados, obterCartao, sincronizarFaturas } from "./cartoes";
import {
  confirmadasDe,
  faturaResumoLinhaSchema,
  linhaParaFaturaResumo,
  resumirFaturas,
  COLUNAS_FATURA,
  type FaturaResumo,
} from "./cartoes-mapeamento";

/** Faturas de todos os cartões com os totais (view faturas_resumo). */
export async function listarFaturasResumo(): Promise<FaturaResumo[]> {
  const { data, error } = await supabaseNavegador()
    .from("faturas_resumo")
    .select(`${COLUNAS_FATURA}, total, lancamentos, conferidos`)
    .order("mes");
  if (error) throw new ErroDeDados(`Não foi possível carregar as faturas: ${error.message}`);
  return faturaResumoLinhaSchema.array().parse(data).map(linhaParaFaturaResumo);
}

/**
 * Registra um gasto no cartão. As parcelas são calculadas pelo core
 * e gravadas junto com a compra numa única transação no banco.
 */
export async function registrarGasto(gasto: NovoGasto): Promise<string> {
  const cartao = await obterCartao(gasto.cartaoId);
  if (!cartao) throw new ErroDeDados("Cartão não encontrado");

  const faturas = (await listarFaturasResumo()).filter((f) => f.cartaoId === gasto.cartaoId);
  const { totaisPorMes, comprometido } = resumirFaturas(faturas);
  const simulacao = simularCompra({
    cartao,
    confirmadas: confirmadasDe(faturas),
    dataCompra: gasto.dataCompra,
    valor: gasto.valor,
    parcelas: gasto.parcelas,
    totaisPorMes,
    limite: cartao.limite,
    comprometido,
    hoje: hojeEmSaoPaulo(),
  });

  // Garante que existem faturas até a última parcela (as históricas não precisam de fatura).
  await sincronizarFaturas(cartao.id, simulacao.ultimoMes);

  const { data, error } = await supabaseNavegador().rpc("registrar_compra", {
    p_cartao_id: gasto.cartaoId,
    p_categoria_id: gasto.categoriaId,
    p_descricao: gasto.descricao,
    p_data_compra: gasto.dataCompra,
    p_valor_total: gasto.valor,
    // Compra antiga com parcelas já pagas = parcelamento em andamento.
    p_origem: simulacao.historicas > 0 ? "anterior_ao_app" : "app",
    p_parcelas: simulacao.parcelas.map((p) => ({
      numero: p.numero,
      mes: `${p.mes}-01`,
      valor: p.valor,
      historico: p.historico,
    })),
  });
  if (error) {
    const faltaFatura = error.message.includes("Faltam faturas");
    throw new ErroDeDados(
      faltaFatura
        ? "Algumas parcelas caem em faturas que ainda não foram geradas. Abra a configuração do cartão, salve de novo e tente outra vez."
        : `Não foi possível salvar o gasto: ${error.message}`,
    );
  }
  return z.uuid().parse(data);
}

/**
 * Parcelamento que já estava em andamento antes do app: lança a compra completa,
 * cria só as parcelas restantes e guarda as anteriores como histórico.
 */
export async function registrarParcelamentoEmAndamento(p: ParcelamentoEmAndamento): Promise<string> {
  const parcelas = parcelamentoEmAndamento({
    valorParcela: p.valorParcela,
    totalParcelas: p.totalParcelas,
    parcelaAtual: p.parcelaAtual,
    faturaAtual: p.mesFatura,
  });
  await sincronizarFaturas(p.cartaoId, parcelas.at(-1)!.mes);

  const { data, error } = await supabaseNavegador().rpc("registrar_compra", {
    p_cartao_id: p.cartaoId,
    p_categoria_id: p.categoriaId,
    p_descricao: p.descricao,
    p_data_compra: null,
    p_valor_total: p.valorParcela * p.totalParcelas,
    p_origem: "anterior_ao_app",
    p_parcelas: parcelas.map((x) => ({ numero: x.numero, mes: `${x.mes}-01`, valor: x.valor, historico: x.historico })),
  });
  if (error) throw new ErroDeDados(`Não foi possível salvar o parcelamento: ${error.message}`);
  return z.uuid().parse(data);
}

/** Fatura aberta informada como um valor único, sem categoria (fora do orçamento). */
export async function registrarSaldoInicial(p: SaldoInicialFatura): Promise<string> {
  await sincronizarFaturas(p.cartaoId, p.mesFatura);
  const { data, error } = await supabaseNavegador().rpc("registrar_compra", {
    p_cartao_id: p.cartaoId,
    p_categoria_id: null,
    p_descricao: "Saldo inicial da fatura",
    p_data_compra: null,
    p_valor_total: p.valor,
    p_origem: "saldo_inicial",
    p_parcelas: [{ numero: 1, mes: `${p.mesFatura}-01`, valor: p.valor, historico: false }],
  });
  if (error) throw new ErroDeDados(`Não foi possível salvar o saldo inicial: ${error.message}`);
  return z.uuid().parse(data);
}

const compraComParcelasSchema = z.object({
  id: z.uuid(),
  descricao: z.string(),
  cartao_id: z.uuid(),
  valor_total: z.number().int(),
  total_parcelas: z.number().int(),
});
const parcelaResumoSchema = z.object({
  compra_id: z.uuid(),
  numero: z.number().int(),
  valor: z.number().int(),
  historico: z.boolean(),
  fatura_id: z.uuid().nullable(),
});

export interface CompraDoInicio {
  id: string;
  descricao: string;
  cartaoId: string;
  valorTotal: number;
  totalParcelas: number;
  /** Primeira parcela que entrou numa fatura (null se todas são histórico). */
  parcelaAtual: number | null;
  /** Soma das parcelas que ainda estão em faturas. */
  restante: number;
  faturaIds: string[];
}

/** Compras lançadas no começo do uso: parcelamentos em andamento e saldos iniciais. */
export async function listarComprasDoInicio(origem: "anterior_ao_app" | "saldo_inicial"): Promise<CompraDoInicio[]> {
  const supabase = supabaseNavegador();
  const { data, error } = await supabase
    .from("compras")
    .select("id, descricao, cartao_id, valor_total, total_parcelas")
    .eq("origem", origem)
    .order("criado_em");
  if (error) throw new ErroDeDados(`Não foi possível carregar os lançamentos: ${error.message}`);
  const compras = compraComParcelasSchema.array().parse(data);
  if (compras.length === 0) return [];

  const { data: brutas, error: e2 } = await supabase
    .from("parcelas")
    .select("compra_id, numero, valor, historico, fatura_id")
    .in("compra_id", compras.map((c) => c.id));
  if (e2) throw new ErroDeDados(`Não foi possível carregar as parcelas: ${e2.message}`);
  const parcelas = parcelaResumoSchema.array().parse(brutas);

  return compras.map((c) => {
    const ativas = parcelas.filter((p) => p.compra_id === c.id && !p.historico).sort((a, b) => a.numero - b.numero);
    return {
      id: c.id,
      descricao: c.descricao,
      cartaoId: c.cartao_id,
      valorTotal: c.valor_total,
      totalParcelas: c.total_parcelas,
      parcelaAtual: ativas[0]?.numero ?? null,
      restante: ativas.reduce((s, p) => s + p.valor, 0),
      faturaIds: ativas.map((p) => p.fatura_id).filter((id): id is string => Boolean(id)),
    };
  });
}
