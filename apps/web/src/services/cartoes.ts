import { z } from "zod";
import {
  hojeEmSaoPaulo,
  planejarRealocacao,
  type CartaoForm,
  type Data,
  type Mes,
} from "@financas/core";
import { supabaseNavegador } from "@/lib/supabase/client";
import {
  COLUNAS_CARTAO,
  COLUNAS_FATURA,
  cartaoLinhaSchema,
  confirmadasDe,
  faturaLinhaSchema,
  formularioParaLinha,
  linhaParaCartao,
  linhaParaFatura,
  planejarSincronizacao,
  type CartaoCompleto,
  type Fatura,
} from "./cartoes-mapeamento";

export class ErroDeDados extends Error {}

const compraComDataSchema = z.object({ id: z.uuid(), data_compra: z.string() });
const parcelaPosicaoSchema = z.object({ compra_id: z.uuid(), numero: z.number().int(), fatura_id: z.uuid().nullable() });

function falhar(contexto: string, erro: { message: string } | null): never {
  throw new ErroDeDados(`${contexto}: ${erro?.message ?? "erro desconhecido"}`);
}

// ───────────── Leitura ─────────────

export async function listarCartoes(): Promise<CartaoCompleto[]> {
  const { data, error } = await supabaseNavegador()
    .from("cartoes")
    .select(COLUNAS_CARTAO)
    .eq("arquivado", false)
    .order("criado_em");
  if (error) falhar("Não foi possível carregar os cartões", error);
  return cartaoLinhaSchema.array().parse(data).map(linhaParaCartao);
}

export async function obterCartao(id: string): Promise<CartaoCompleto | null> {
  const { data, error } = await supabaseNavegador().from("cartoes").select(COLUNAS_CARTAO).eq("id", id).maybeSingle();
  if (error) falhar("Não foi possível carregar o cartão", error);
  return data ? linhaParaCartao(cartaoLinhaSchema.parse(data)) : null;
}

export async function listarFaturas(cartaoId: string): Promise<Fatura[]> {
  const { data, error } = await supabaseNavegador()
    .from("faturas")
    .select(COLUNAS_FATURA)
    .eq("cartao_id", cartaoId)
    .order("mes");
  if (error) falhar("Não foi possível carregar as faturas", error);
  return faturaLinhaSchema.array().parse(data).map(linhaParaFatura);
}

// ───────────── Escrita ─────────────

export async function criarCartao(form: CartaoForm): Promise<string> {
  const { data, error } = await supabaseNavegador()
    .from("cartoes")
    .insert(formularioParaLinha(form))
    .select("id")
    .single();
  if (error || !data) falhar("Não foi possível salvar o cartão", error);
  const { id } = z.object({ id: z.uuid() }).parse(data);
  await sincronizarFaturas(id);
  return id;
}

export async function atualizarCartao(id: string, form: CartaoForm): Promise<void> {
  const { error } = await supabaseNavegador().from("cartoes").update(formularioParaLinha(form)).eq("id", id);
  if (error) falhar("Não foi possível salvar o cartão", error);
  await sincronizarFaturas(id);
}

/** Confirma (ou corrige) as datas de uma fatura. Só ela muda; as compras afetadas são realocadas. */
export async function corrigirFatura(params: {
  cartaoId: string;
  mes: Mes;
  fechamento: Data;
  vencimento: Data;
}): Promise<void> {
  const { error } = await supabaseNavegador()
    .from("faturas")
    .upsert(
      {
        cartao_id: params.cartaoId,
        mes: `${params.mes}-01`,
        fechamento: params.fechamento,
        vencimento: params.vencimento,
        status: "confirmada",
      },
      { onConflict: "cartao_id,mes" },
    );
  if (error) falhar("Não foi possível corrigir a fatura", error);
  await sincronizarFaturas(params.cartaoId);
}

/**
 * Mantém as faturas futuras de acordo com a regra do cartão:
 * cria as que faltam, atualiza as estimadas e realoca compras que mudaram de fatura.
 */
export async function sincronizarFaturas(cartaoId: string, ateMes?: Mes): Promise<void> {
  const supabase = supabaseNavegador();
  const cartao = await obterCartao(cartaoId);
  if (!cartao) return;

  const existentes = await listarFaturas(cartaoId);
  const faturaPorId = new Map(existentes.map((f) => [f.id, f]));

  // Compras com data e onde está cada parcela hoje.
  const { data: comprasBrutas, error: e1 } = await supabase
    .from("compras")
    .select("id, data_compra")
    .eq("cartao_id", cartaoId)
    .not("data_compra", "is", null);
  if (e1) falhar("Não foi possível carregar as compras", e1);
  const compras = compraComDataSchema.array().parse(comprasBrutas ?? []);

  const idsCompras = compras.map((c) => c.id);
  const parcelas: { compra_id: string; numero: number; fatura_id: string }[] = [];
  if (idsCompras.length > 0) {
    const { data, error } = await supabase
      .from("parcelas")
      .select("compra_id, numero, fatura_id")
      .in("compra_id", idsCompras);
    if (error) falhar("Não foi possível carregar as parcelas", error);
    // Parcelas históricas (pagas antes do app) não têm fatura: ficam fora da sincronização.
    for (const p of parcelaPosicaoSchema.array().parse(data ?? [])) {
      if (p.fatura_id) parcelas.push({ ...p, fatura_id: p.fatura_id });
    }
  }

  const mesesUsados = parcelas.map((p) => faturaPorId.get(p.fatura_id)?.mes).filter((m): m is Mes => Boolean(m));
  if (ateMes) mesesUsados.push(ateMes);
  const ultimoMesUsado = mesesUsados.sort().at(-1);

  const plano = planejarSincronizacao({ cartao, existentes, hoje: hojeEmSaoPaulo(), ultimoMesUsado });
  if (plano.gravar.length > 0) {
    const { error } = await supabase.from("faturas").upsert(plano.gravar, { onConflict: "cartao_id,mes" });
    if (error) falhar("Não foi possível gerar as faturas", error);
  }

  // Realoca compras cuja primeira parcela deveria estar em outra fatura.
  const primeiraFatura = new Map(
    parcelas.filter((p) => p.numero === 1).map((p) => [p.compra_id, faturaPorId.get(p.fatura_id)?.mes]),
  );
  const alocadas = compras.flatMap((c) => {
    const mes = primeiraFatura.get(c.id);
    return mes ? [{ id: c.id, dataCompra: c.data_compra, primeiraFatura: mes }] : [];
  });
  const realocacoes = planejarRealocacao(cartao, confirmadasDe(existentes), alocadas);
  for (const r of realocacoes) {
    const { error } = await supabase.rpc("realocar_compra", { p_compra_id: r.id, p_meses: r.deslocamento });
    if (error) falhar("Não foi possível realocar uma compra", error);
  }
}
