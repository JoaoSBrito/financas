import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AvisoGlobal } from "@/componentes/AvisoGlobal";
import { AppShell } from "@/componentes/navegacao/AppShell";
import { supabaseServidor } from "@/lib/supabase/server";

export default async function LayoutApp({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  // O proxy já redireciona, mas a verificação aqui protege contra rotas fora do matcher.
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/entrar");

  return (
    <>
      <AppShell>{children}</AppShell>
      {modal}
      <AvisoGlobal />
    </>
  );
}
