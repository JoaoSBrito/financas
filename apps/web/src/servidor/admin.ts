import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave secreta: ignora o RLS. Use SOMENTE em rotas do servidor
 * (tarefa diária) e nunca importe em componentes.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const chave = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !chave) throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no servidor.");
  return createClient(new URL(url).origin, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}
