import { z } from "zod";
import type { ContaForm, Data, Mes, MovimentoForm, RecorrenteForm, TransferenciaEntreContas } from "@financas/core";
import { dataNoMes, partesDoMes, ultimoDiaDoMes } from "@financas/core";
import { supabaseNavegador } from "@/lib/supabase/client";
import { ErroDeDados } from "./cartoes";

function falhar(contexto: string, erro: { message: string }): never {
  throw new ErroDeDados(`${contexto}: ${erro.message}`);
}

// ───────────── Contas ─────────────

const contaSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  tipo: z.enum(["corrente", "carteira", "outra"]),
  conferida_em: z.string().nullable(),
  saldo: z.number().int(),
});

export interface Conta {
  id: string;
  nome: string;
  tipo: "corrente" | "carteira" | "outra";
  conferidaEm: Data | null;
  saldo: number;
}

export async function listarContas(): Promise<Conta[]> {
  const { data, error } = await supabaseNavegador().from("saldo_contas").select("id, nome, tipo, conferida_em, saldo").order("nome");
  if (error) falhar("Não foi possível carregar as contas", error);
  return contaSchema.array().parse(data).map((c) => ({ id: c.id, nome: c.nome, tipo: c.tipo, conferidaEm: c.conferida_em, saldo: c.saldo }));
}

export async function criarConta(form: ContaForm): Promise<string> {
  const { data, error } = await supabaseNavegador().rpc("criar_conta", {
    p_nome: form.nome,
    p_tipo: form.tipo,
    p_saldo: form.saldoAtual,
  });
  if (error) falhar("Não foi possível criar a conta", error);
  return z.uuid().parse(data);
}

/** Lança a diferença entre o saldo do app e o do banco. Devolve o ajuste lançado. */
export async function ajustarSaldo(contaId: string, saldoReal: number, hoje: Data): Promise<number> {
  const { data, error } = await supabaseNavegador().rpc("ajustar_saldo", {
    p_conta_id: contaId,
    p_saldo_real: saldoReal,
    p_data: hoje,
  });
  if (error) falhar("Não foi possível ajustar o saldo", error);
  return z.number().int().parse(data);
}

// ───────────── Movimentos ─────────────

const movimentoSchema = z.object({
  id: z.uuid(),
  conta_id: z.uuid(),
  data: z.string(),
  descricao: z.string(),
  valor: z.number().int(),
  tipo: z.enum(["saldo_inicial", "entrada", "saida", "transferencia", "ajuste"]),
  recorrente_id: z.uuid().nullable(),
  transferencia_id: z.uuid().nullable(),
});

export interface MovimentoConta {
  id: string;
  contaId: string;
  data: Data;
  descricao: string;
  valor: number;
  tipo: "saldo_inicial" | "entrada" | "saida" | "transferencia" | "ajuste";
  recorrenteId: string | null;
  transferenciaId: string | null;
  /** Transferência entre contas suas (pode ser desfeita). */
  entreContas: boolean;
}

/** Movimentos do mês inteiro (inclui os agendados para depois de hoje). */
export async function listarMovimentosDoMes(mes: Mes): Promise<MovimentoConta[]> {
  const { ano, mes: m } = partesDoMes(mes);
  const fim = dataNoMes(ano, m, ultimoDiaDoMes(ano, m));
  const supabase = supabaseNavegador();
  const { data, error } = await supabase
    .from("movimentos")
    .select("id, conta_id, data, descricao, valor, tipo, recorrente_id, transferencia_id")
    .gte("data", `${mes}-01`)
    .lte("data", fim)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false });
  if (error) falhar("Não foi possível carregar os movimentos", error);

  const { data: entre, error: e2 } = await supabase
    .from("transferencias")
    .select("id")
    .eq("tipo", "entre_contas")
    .gte("data", `${mes}-01`)
    .lte("data", fim);
  if (e2) falhar("Não foi possível carregar as transferências", e2);
  const idsEntreContas = new Set(z.object({ id: z.uuid() }).array().parse(entre).map((t) => t.id));

  return movimentoSchema.array().parse(data).map((x) => ({
    id: x.id,
    contaId: x.conta_id,
    data: x.data,
    descricao: x.descricao,
    valor: x.valor,
    tipo: x.tipo,
    recorrenteId: x.recorrente_id,
    transferenciaId: x.transferencia_id,
    entreContas: x.transferencia_id !== null && idsEntreContas.has(x.transferencia_id),
  }));
}

/** Saídas reais da conta (sem transferências e ajustes) somadas por mês, para o custo de vida. */
export async function listarSaidasPorMes(de: Mes, ate: Mes): Promise<Map<Mes, number>> {
  const { ano, mes: m } = partesDoMes(ate);
  const { data, error } = await supabaseNavegador()
    .from("movimentos")
    .select("data, valor")
    .eq("tipo", "saida")
    .gte("data", `${de}-01`)
    .lte("data", dataNoMes(ano, m, ultimoDiaDoMes(ano, m)));
  if (error) falhar("Não foi possível carregar as saídas", error);
  const mapa = new Map<Mes, number>();
  for (const x of z.object({ data: z.string(), valor: z.number().int() }).array().parse(data)) {
    const chave = x.data.slice(0, 7);
    mapa.set(chave, (mapa.get(chave) ?? 0) - x.valor);
  }
  return mapa;
}

// ───────────── Transferência entre contas ─────────────

export async function transferirEntreContas(t: TransferenciaEntreContas): Promise<void> {
  const { error } = await supabaseNavegador().rpc("transferir_entre_contas", {
    p_origem: t.origemId,
    p_destino: t.destinoId,
    p_valor: t.valor,
    p_data: t.data,
    p_descricao: t.descricao || null,
  });
  if (error) falhar("Não foi possível transferir", error);
}

export async function desfazerTransferencia(transferenciaId: string): Promise<void> {
  const { error } = await supabaseNavegador().rpc("desfazer_transferencia", { p_transferencia_id: transferenciaId });
  if (error) falhar("Não foi possível desfazer a transferência", error);
}

export async function registrarMovimento(form: MovimentoForm, recorrenteId?: string): Promise<void> {
  const { error } = await supabaseNavegador().from("movimentos").insert({
    conta_id: form.contaId,
    data: form.data,
    descricao: form.descricao,
    valor: form.tipo === "entrada" ? form.valor : -form.valor,
    tipo: form.tipo,
    categoria_id: form.categoriaId,
    recorrente_id: recorrenteId ?? null,
  });
  if (error) falhar("Não foi possível salvar o movimento", error);
}

/** Só entradas, saídas e ajustes; transferências se desfazem pela origem (fatura, caixinha). */
export async function excluirMovimento(id: string): Promise<void> {
  const { error } = await supabaseNavegador().from("movimentos").delete().eq("id", id).neq("tipo", "transferencia");
  if (error) falhar("Não foi possível excluir o movimento", error);
}

// ───────────── Recorrentes ─────────────

const recorrenteSchema = z.object({
  id: z.uuid(),
  descricao: z.string(),
  tipo: z.enum(["entrada", "saida"]),
  valor: z.number().int(),
  dia: z.number().int(),
  conta_id: z.uuid().nullable(),
  cartao_id: z.uuid().nullable(),
  categoria_id: z.uuid().nullable(),
});

export interface Recorrente {
  id: string;
  descricao: string;
  tipo: "entrada" | "saida";
  valor: number;
  dia: number;
  contaId: string | null;
  cartaoId: string | null;
  categoriaId: string | null;
}

export async function listarRecorrentes(): Promise<Recorrente[]> {
  const { data, error } = await supabaseNavegador()
    .from("recorrentes")
    .select("id, descricao, tipo, valor, dia, conta_id, cartao_id, categoria_id")
    .eq("ativo", true)
    .order("dia");
  if (error) falhar("Não foi possível carregar os recorrentes", error);
  return recorrenteSchema.array().parse(data).map((r) => ({
    id: r.id,
    descricao: r.descricao,
    tipo: r.tipo,
    valor: r.valor,
    dia: r.dia,
    contaId: r.conta_id,
    cartaoId: r.cartao_id,
    categoriaId: r.categoria_id,
  }));
}

export async function salvarRecorrente(id: string | undefined, form: RecorrenteForm): Promise<void> {
  const linha = {
    descricao: form.descricao,
    tipo: form.tipo,
    valor: form.valor,
    dia: form.dia,
    conta_id: form.contaId,
    cartao_id: form.cartaoId,
    categoria_id: form.categoriaId,
  };
  const consulta = id
    ? supabaseNavegador().from("recorrentes").update(linha).eq("id", id)
    : supabaseNavegador().from("recorrentes").insert(linha);
  const { error } = await consulta;
  if (error) falhar("Não foi possível salvar o recorrente", error);
}

export async function desativarRecorrente(id: string): Promise<void> {
  const { error } = await supabaseNavegador().from("recorrentes").update({ ativo: false }).eq("id", id);
  if (error) falhar("Não foi possível remover o recorrente", error);
}

// ───────────── Pagamento de fatura ─────────────

/** Sem conta, só marca a fatura como paga (sem mexer em saldo). */
export async function pagarFatura(faturaId: string, contaId: string | null, data: Data): Promise<void> {
  const { error } = await supabaseNavegador().rpc("pagar_fatura", { p_fatura_id: faturaId, p_conta_id: contaId, p_data: data });
  if (error) falhar("Não foi possível marcar a fatura como paga", error);
}

export async function desfazerPagamento(faturaId: string): Promise<void> {
  const { error } = await supabaseNavegador().rpc("desfazer_pagamento_fatura", { p_fatura_id: faturaId });
  if (error) falhar("Não foi possível desfazer o pagamento", error);
}
