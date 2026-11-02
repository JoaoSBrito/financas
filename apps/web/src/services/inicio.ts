import { z } from "zod";
import type { Data, Mes } from "@financas/core";
import { supabaseNavegador } from "@/lib/supabase/client";
import { ErroDeDados } from "./cartoes";

const orcamentoSchema = z.object({
  categoria_id: z.uuid(),
  vigente_desde: z.string(),
  valor: z.number().int().nullable(),
});

/** Orçamento vigente de cada categoria num mês (o mais recente que já começou). */
export async function listarOrcamentosVigentes(mes: Mes): Promise<Map<string, number>> {
  const { data, error } = await supabaseNavegador()
    .from("orcamentos")
    .select("categoria_id, vigente_desde, valor")
    .lte("vigente_desde", `${mes}-01`)
    .order("vigente_desde", { ascending: false });
  if (error) throw new ErroDeDados(`Não foi possível carregar os orçamentos: ${error.message}`);
  // O registro mais recente de cada categoria decide; valor nulo = sem orçamento.
  const decididas = new Set<string>();
  const mapa = new Map<string, number>();
  for (const o of orcamentoSchema.array().parse(data)) {
    if (decididas.has(o.categoria_id)) continue;
    decididas.add(o.categoria_id);
    if (o.valor !== null) mapa.set(o.categoria_id, o.valor);
  }
  return mapa;
}

const compraRecenteSchema = z.object({
  id: z.uuid(),
  descricao: z.string(),
  data_compra: z.string().nullable(),
  valor_total: z.number().int(),
  total_parcelas: z.number().int(),
  cartao_id: z.uuid(),
  categoria_id: z.uuid().nullable(),
});

export interface CompraRecente {
  id: string;
  descricao: string;
  dataCompra: Data | null;
  valorTotal: number;
  totalParcelas: number;
  cartaoId: string;
  categoriaId: string | null;
}

/** Últimos gastos lançados no app (sem saldo inicial nem parcelamentos antigos). */
export async function listarComprasRecentes(limite = 5): Promise<CompraRecente[]> {
  const { data, error } = await supabaseNavegador()
    .from("compras")
    .select("id, descricao, data_compra, valor_total, total_parcelas, cartao_id, categoria_id")
    .eq("origem", "app")
    .order("data_compra", { ascending: false, nullsFirst: false })
    .order("criado_em", { ascending: false })
    .limit(limite);
  if (error) throw new ErroDeDados(`Não foi possível carregar os últimos gastos: ${error.message}`);
  return compraRecenteSchema.array().parse(data).map((c) => ({
    id: c.id,
    descricao: c.descricao,
    dataCompra: c.data_compra,
    valorTotal: c.valor_total,
    totalParcelas: c.total_parcelas,
    cartaoId: c.cartao_id,
    categoriaId: c.categoria_id,
  }));
}
