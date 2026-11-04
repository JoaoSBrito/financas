import { z } from "zod";
import type { CaixinhaForm, Data, MovimentoCaixinha } from "@financas/core";
import { supabaseNavegador } from "@/lib/supabase/client";
import { ErroDeDados } from "./cartoes";

function falhar(contexto: string, erro: { message: string }): never {
  throw new ErroDeDados(`${contexto}: ${erro.message}`);
}

const caixinhaSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  meta: z.number().int().nullable(),
  data_meta: z.string().nullable(),
  cartao_id: z.uuid().nullable(),
  percentual_cdi: z.coerce.number().nullable(),
  saldo: z.number().int(),
  reserva_meses: z.number().int().nullable(),
});

export interface Caixinha {
  id: string;
  nome: string;
  meta: number | null;
  dataMeta: Data | null;
  cartaoId: string | null;
  percentualCdi: number | null;
  saldo: number;
  /** Meses de cobertura quando é a reserva de emergência. */
  reservaMeses: number | null;
}

export async function listarCaixinhas(): Promise<Caixinha[]> {
  const { data, error } = await supabaseNavegador()
    .from("saldo_caixinhas")
    .select("id, nome, meta, data_meta, cartao_id, percentual_cdi, saldo, reserva_meses")
    .order("nome");
  if (error) falhar("Não foi possível carregar as caixinhas", error);
  return caixinhaSchema.array().parse(data).map((c) => ({
    id: c.id,
    nome: c.nome,
    meta: c.meta,
    dataMeta: c.data_meta,
    cartaoId: c.cartao_id,
    percentualCdi: c.percentual_cdi,
    saldo: c.saldo,
    reservaMeses: c.reserva_meses,
  }));
}

const movSchema = z.object({
  caixinha_id: z.uuid(),
  data: z.string(),
  valor: z.number().int(),
  tipo: z.enum(["deposito", "resgate", "rendimento_estimado", "ajuste"]),
});

export async function listarMovimentosCaixinhas(): Promise<MovimentoCaixinha[]> {
  const { data, error } = await supabaseNavegador().from("caixinha_movimentos").select("caixinha_id, data, valor, tipo").order("data");
  if (error) falhar("Não foi possível carregar os movimentos das caixinhas", error);
  return movSchema.array().parse(data).map((m) => ({ caixinhaId: m.caixinha_id, data: m.data, valor: m.valor, tipo: m.tipo }));
}

/** Reserva de emergência não tem meta manual, data nem cartão vinculado. */
function limparSeReserva(form: CaixinhaForm): CaixinhaForm {
  return form.reservaMeses ? { ...form, meta: null, dataMeta: null, cartaoId: null } : form;
}

async function definirReserva(id: string, meses: number | null): Promise<void> {
  const { error } = await supabaseNavegador().rpc("definir_reserva", { p_caixinha_id: id, p_meses: meses });
  if (error) falhar("Não foi possível salvar a reserva de emergência", error);
}

export async function criarCaixinha(original: CaixinhaForm, saldoAtual: number, hoje: Data): Promise<string> {
  const form = limparSeReserva(original);
  const { data, error } = await supabaseNavegador().rpc("criar_caixinha", {
    p_nome: form.nome,
    p_meta: form.meta,
    p_data_meta: form.dataMeta,
    p_cartao_id: form.cartaoId,
    p_percentual_cdi: form.percentualCdi,
    p_saldo: saldoAtual,
    p_data: hoje,
  });
  if (error) falhar("Não foi possível criar a caixinha", error);
  const id = z.uuid().parse(data);
  if (form.reservaMeses) await definirReserva(id, form.reservaMeses);
  return id;
}

export async function editarCaixinha(id: string, original: CaixinhaForm): Promise<void> {
  const form = limparSeReserva(original);
  const { error } = await supabaseNavegador()
    .from("caixinhas")
    .update({
      nome: form.nome,
      meta: form.meta,
      data_meta: form.dataMeta,
      cartao_id: form.cartaoId,
      percentual_cdi: form.percentualCdi,
    })
    .eq("id", id);
  if (error) falhar("Não foi possível salvar a caixinha", error);
  await definirReserva(id, form.reservaMeses);
}

/** Só some da lista; o histórico continua. */
export async function arquivarCaixinha(id: string): Promise<void> {
  const { error } = await supabaseNavegador().from("caixinhas").update({ arquivada: true }).eq("id", id);
  if (error) falhar("Não foi possível arquivar a caixinha", error);
}

export async function movimentarCaixinha(p: {
  caixinhaId: string;
  contaId: string;
  tipo: "deposito" | "resgate";
  valor: number;
  data: Data;
}): Promise<void> {
  const { error } = await supabaseNavegador().rpc("movimentar_caixinha", {
    p_caixinha_id: p.caixinhaId,
    p_conta_id: p.contaId,
    p_tipo: p.tipo,
    p_valor: p.valor,
    p_data: p.data,
  });
  if (error) falhar(p.tipo === "deposito" ? "Não foi possível guardar" : "Não foi possível resgatar", error);
}

export async function atualizarSaldoCaixinha(caixinhaId: string, saldoReal: number, hoje: Data): Promise<number> {
  const { data, error } = await supabaseNavegador().rpc("atualizar_saldo_caixinha", {
    p_caixinha_id: caixinhaId,
    p_saldo_real: saldoReal,
    p_data: hoje,
  });
  if (error) falhar("Não foi possível atualizar o saldo", error);
  return z.number().int().parse(data);
}
