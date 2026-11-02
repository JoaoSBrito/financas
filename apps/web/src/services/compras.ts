import { z } from "zod";
import { simularCompra, type NovoGasto } from "@financas/core";
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
  });

  // Garante que existem faturas até a última parcela.
  await sincronizarFaturas(cartao.id, simulacao.ultimoMes);

  const { data, error } = await supabaseNavegador().rpc("registrar_compra", {
    p_cartao_id: gasto.cartaoId,
    p_categoria_id: gasto.categoriaId,
    p_descricao: gasto.descricao,
    p_data_compra: gasto.dataCompra,
    p_valor_total: gasto.valor,
    p_origem: "app",
    p_parcelas: simulacao.parcelas.map((p) => ({
      numero: p.numero,
      mes: `${p.mes}-01`,
      valor: p.valor,
      historico: false,
    })),
  });
  if (error) throw new ErroDeDados(`Não foi possível salvar o gasto: ${error.message}`);
  return z.uuid().parse(data);
}
