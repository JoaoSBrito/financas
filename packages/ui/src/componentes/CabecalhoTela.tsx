"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
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
  sx?: SxProps<Theme>;
}

/**
 * Cabeçalho das telas secundárias.
 * Celular: barra de ponta a ponta no topo (voltar, título de 17 px, ação) com divisor embaixo.
 * A partir de 600 px: título de página (28 px no desktop), sem divisor.
 */
export function CabecalhoTela({ titulo, voltar, acao, adorno, sx }: CabecalhoTelaProps) {
  return (
    <Box
      component="header"
      sx={[
        {
          display: "flex",
          alignItems: "center",
          gap: 1,
          minHeight: { xs: 60, sm: 48 },
          // No celular, cola no topo e vai de ponta a ponta (anula o respiro do <main>).
          mt: { xs: -4, sm: 0 },
          mx: { xs: -4, sm: 0 },
          pl: { xs: 1, sm: 0 },
          pr: { xs: 3, sm: 0 },
          borderBottom: { xs: `1px solid ${paleta.divisor}`, sm: "none" },
          mb: { xs: 4, sm: 5 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {voltar}
      {adorno}
      <Typography variant="h1" sx={{ flex: 1, minWidth: 0, fontSize: { xs: 17, sm: 24, md: 28 } }}>
        {titulo}
      </Typography>
      {acao}
    </Box>
  );
}
