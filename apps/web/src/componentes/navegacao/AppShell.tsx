import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { MenuPrincipal } from "./MenuPrincipal";

/**
 * Celular (xs): conteúdo + barra inferior.
 * Janela média (sm): menu no topo.
 * Desktop (md+): menu lateral.
 * A troca é por CSS, então não "pisca" ao carregar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100dvh" }}>
      <MenuPrincipal />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          px: { xs: 5, md: 10 },
          pt: { xs: 6, md: 8 },
          pb: { xs: "calc(104px + env(safe-area-inset-bottom))", sm: 12 },
        }}
      >
        <Box sx={{ maxWidth: 1120, mx: "auto" }}>{children}</Box>
      </Box>
      <BottomNav />
    </Box>
  );
}
