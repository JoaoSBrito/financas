import { z } from "zod";
import type { CategoriaForm, Mes } from "@financas/core";
import { supabaseNavegador } from "@/lib/supabase/client";
import { ErroDeDados } from "./cartoes";

const categoriaLinhaSchema = z.object({ id: z.uuid(), nome: z.string() });
export type Categoria = z.infer<typeof categoriaLinhaSchema>;

export async function listarCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabaseNavegador()
    .from("categorias")
    .select("id, nome")
    .eq("arquivada", false)
    .order("nome");
  if (error) throw new ErroDeDados(`Não foi possível carregar as categorias: ${error.message}`);
  return categoriaLinhaSchema.array().parse(data);
}

function erroDeCategoria(contexto: string, error: { code?: string; message: string }): never {
  if (error.code === "23505") throw new ErroDeDados("Já existe uma categoria com esse nome.");
  throw new ErroDeDados(`${contexto}: ${error.message}`);
}

/** Grava o orçamento a partir do mês informado (nulo = sem orçamento daqui em diante). */
async function definirOrcamento(categoriaId: string, mes: Mes, valor: number | null) {
  const { error } = await supabaseNavegador()
    .from("orcamentos")
    .upsert({ categoria_id: categoriaId, vigente_desde: `${mes}-01`, valor }, { onConflict: "categoria_id,vigente_desde" });
  if (error) throw new ErroDeDados(`Não foi possível salvar o orçamento: ${error.message}`);
}

export async function criarCategoria(form: CategoriaForm, mes: Mes): Promise<string> {
  const { data, error } = await supabaseNavegador().from("categorias").insert({ nome: form.nome }).select("id").single();
  if (error || !data) erroDeCategoria("Não foi possível criar a categoria", error ?? { message: "sem resposta" });
  const { id } = z.object({ id: z.uuid() }).parse(data);
  if (form.orcamentoMensal !== null) await definirOrcamento(id, mes, form.orcamentoMensal);
  return id;
}

export async function atualizarCategoria(
  id: string,
  form: CategoriaForm,
  mes: Mes,
  orcamentoAtual: number | null,
): Promise<void> {
  const { error } = await supabaseNavegador().from("categorias").update({ nome: form.nome }).eq("id", id);
  if (error) erroDeCategoria("Não foi possível salvar a categoria", error);
  if (form.orcamentoMensal !== orcamentoAtual) await definirOrcamento(id, mes, form.orcamentoMensal);
}

/** Arquivar mantém os gastos antigos com a categoria; ela só some das escolhas. */
export async function arquivarCategoria(id: string): Promise<void> {
  const { error } = await supabaseNavegador().from("categorias").update({ arquivada: true }).eq("id", id);
  if (error) throw new ErroDeDados(`Não foi possível arquivar a categoria: ${error.message}`);
}
