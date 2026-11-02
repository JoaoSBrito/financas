import { z } from "zod";
import {
  hojeEmSaoPaulo,
  parcelamentoEmAndamento,
  simularCompra,
  type NovoGasto,
  type ParcelamentoEmAndamento,
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
