import type { Metadata } from "next";
import { supabaseServidor } from "@/lib/supabase/server";
import { TelaAjustes } from "@/telas/ajustes/TelaAjustes";

export const metadata: Metadata = { title: "Ajustes" };

export default async function Pagina() {
  // O e-mail vem da sessão (o layout do app já garante que ela existe).
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  return <TelaAjustes email={email} />;
}
