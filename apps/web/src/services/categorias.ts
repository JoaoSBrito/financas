import { z } from "zod";
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
