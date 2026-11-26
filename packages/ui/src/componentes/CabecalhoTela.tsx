"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { paleta } from "../tokens";

export interface CabecalhoTelaProps {
  titulo: string;
  /** Botão de voltar (o app passa um IconButton com link). */
  voltar?: ReactNode;
  /** Ação à direita (ex.: "+ Nova"). */
  acao?: ReactNode;
  /** Selo ou ícone ao lado do título. */
  adorno?: ReactNode;
}

/** Cabeçalho das telas secundárias: voltar, título e ação. */
export function CabecalhoTela({ titulo, voltar, acao, adorno }: CabecalhoTelaProps) {
  return (
    <Box component="header" sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 56, borderBottom: `1px solid ${paleta.divisor}`, mx: { xs: -4, md: 0 }, px: { xs: 1, md: 0 }, mb: 4 }}>
      {voltar}
      {adorno}
      <Typography variant="h1" sx={{ flex: 1, minWidth: 0, fontSize: { xs: 17, md: 28 } }}>
        {titulo}
      </Typography>
      {acao}
    </Box>
  );
}
