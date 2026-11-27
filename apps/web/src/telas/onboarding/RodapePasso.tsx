"use client";

import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import { paleta } from "@financas/ui/tokens";

/** Ação principal do passo, presa ao rodapé no celular enquanto a tela rola. */
export function RodapePasso({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        position: { xs: "sticky", md: "static" },
        bottom: 0,
        zIndex: 1,
        mt: 2,
        mx: { xs: -4, md: 0 },
        px: { xs: 4, md: 0 },
        pt: 3,
        pb: { xs: "calc(16px + env(safe-area-inset-bottom))", md: 0 },
        bgcolor: { xs: paleta.painel, md: "transparent" },
        borderTop: { xs: `1px solid ${paleta.divisor}`, md: "none" },
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}
