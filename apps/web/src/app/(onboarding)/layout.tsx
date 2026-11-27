import Box from "@mui/material/Box";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AvisoGlobal } from "@/componentes/AvisoGlobal";
import { supabaseServidor } from "@/lib/supabase/server";

/** Primeiros passos: sem menu, conteúdo centralizado. */
export default async function LayoutOnboarding({ children }: { children: ReactNode }) {
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/entrar");

  return (
    <Box component="main" sx={{ px: { xs: 4, md: 10 }, pt: { xs: 3, md: 10 }, pb: { xs: 0, md: 12 } }}>
      <Box sx={{ maxWidth: 880, mx: "auto" }}>{children}</Box>
      <AvisoGlobal />
    </Box>
  );
}
