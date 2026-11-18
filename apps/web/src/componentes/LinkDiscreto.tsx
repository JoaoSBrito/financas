import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";
import { toqueMinimo } from "@financas/ui/tokens";

/**
 * Link secundário de cabeçalho de seção ("Ver tudo", "Ajustar regra").
 * Cor secundária, sublinha no hover e tem área de toque de 44px
 * sem aumentar a altura visual do cabeçalho.
 */
export function LinkDiscreto({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Typography
      component={Link}
      href={href}
      variant="body2"
      sx={{
        color: "text.secondary",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        minHeight: toqueMinimo,
        my: -3,
        "&:hover": { color: "text.primary", textDecoration: "underline" },
      }}
    >
      {children}
    </Typography>
  );
}
