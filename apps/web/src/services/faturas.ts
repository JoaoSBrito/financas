import { z } from "zod";
import { mesDe, type Data, type LancamentoResumo, type Mes } from "@financas/core";
import { supabaseNavegador } from "@/lib/supabase/client";
import { ErroDeDados } from "./cartoes";

const lancamentoLinhaSchema = z.object({
  id: z.uuid(),
  compra_id: z.uuid(),
  fatura_id: z.uuid(),
  numero: z.number().int(),
  valor: z.number().int(),
  conferida: z.boolean(),
  mes: z.string(),
  cartao_id: z.uuid(),
  descricao: z.string(),
  data_compra: z.string().nullable(),
  total_parcelas: z.number().int(),
  origem: z.enum(["app", "anterior_ao_app", "saldo_inicial", "importada", "recorrente"]),
  categoria_id: z.uuid().nullable(),
  categoria_nome: z.string().nullable(),
});

export interface Lancamento extends LancamentoResumo {
  id: string;
  faturaId: string;
  cartaoId: string;
  dataCompra: Data | null;
  categoriaId: string | null;
  categoriaNome: string | null;
}

const COLUNAS =
  "id, compra_id, fatura_id, numero, valor, conferida, mes, cartao_id, descricao, data_compra, total_parcelas, origem, categoria_id, categoria_nome";

function paraLancamento(l: z.infer<typeof lancamentoLinhaSchema>): Lancamento {
  return {
    id: l.id,
    compraId: l.compra_id,
    faturaId: l.fatura_id,
    cartaoId: l.cartao_id,
    numero: l.numero,
    totalParcelas: l.total_parcelas,
    valor: l.valor,
    conferida: l.conferida,
    mes: mesDe(l.mes),
    descricao: l.descricao,
    dataCompra: l.data_compra,
    origem: l.origem,
    categoriaId: l.categoria_id,
    categoriaNome: l.categoria_nome,
  };
}

function falhar(contexto: string, erro: { message: string }): never {
  throw new ErroDeDados(`${contexto}: ${erro.message}`);
}

/** Lançamentos de um cartão a partir de um mês (fatura escolhida e parcelamentos ativos). */
export async function listarLancamentos(cartaoId: string, aPartirDe: Mes): Promise<Lancamento[]> {
  const { data, error } = await supabaseNavegador()
    .from("lancamentos")
    .select(COLUNAS)
    .eq("cartao_id", cartaoId)
    .gte("mes", `${aPartirDe}-01`)
    .order("data_compra", { ascending: false, nullsFirst: false })
    .order("descricao");
  if (error) falhar("Não foi possível carregar os lançamentos", error);
  return lancamentoLinhaSchema.array().parse(data).map(paraLancamento);
}

/** Lançamentos de todos os cartões nas faturas de um mês (orçamento por categoria). */
export async function listarLancamentosDoMes(mes: Mes): Promise<Lancamento[]> {
  const { data, error } = await supabaseNavegador().from("lancamentos").select(COLUNAS).eq("mes", `${mes}-01`);
  if (error) falhar("Não foi possível carregar os lançamentos do mês", error);
  return lancamentoLinhaSchema.array().parse(data).map(paraLancamento);
}

export async function marcarConferida(parcelaId: string, conferida: boolean): Promise<void> {
  const { error } = await supabaseNavegador().from("parcelas").update({ conferida }).eq("id", parcelaId);
  if (error) falhar("Não foi possível marcar o lançamento", error);
}

/** Por enquanto só registra a data; com a tela de Contas, o pagamento vira transferência. */
export async function marcarFaturaPaga(faturaId: string, pagaEm: Data | null): Promise<void> {
  const { error } = await supabaseNavegador().from("faturas").update({ paga_em: pagaEm }).eq("id", faturaId);
  if (error) falhar("Não foi possível atualizar a fatura", error);
}

export async function editarCompra(compraId: string, dados: { descricao: string; categoriaId: string | null }) {
  const { error } = await supabaseNavegador()
    .from("compras")
    .update({ descricao: dados.descricao, categoria_id: dados.categoriaId })
    .eq("id", compraId);
  if (error) falhar("Não foi possível editar o gasto", error);
}

/** Exclui a compra e todas as parcelas dela (em todas as faturas). */
export async function excluirCompra(compraId: string): Promise<void> {
  const { error } = await supabaseNavegador().from("compras").delete().eq("id", compraId);
  if (error) falhar("Não foi possível excluir o gasto", error);
}
