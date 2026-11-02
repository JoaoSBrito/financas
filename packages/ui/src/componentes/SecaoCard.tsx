"use client";

import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";

export interface SecaoCardProps {
  titulo?: string;
  /** Link ou botão discreto à direita do título (ex.: "Ver tudo"). */
  acao?: ReactNode;
  children: ReactNode;
  /** Nível do título para a hierarquia da página. */
  nivelTitulo?: "h2" | "h3";
  gap?: number;
}

/** Card branco com título opcional: o bloco básico de quase todas as telas. */
export function SecaoCard({ titulo, acao, children, nivelTitulo = "h2", gap = 3.5 }: SecaoCardProps) {
  // O título nomeia a seção para leitores de tela (vira um "landmark" navegável).
  const idTitulo = useId();
  return (
    <Card component="section" aria-labelledby={titulo ? idTitulo : undefined} sx={{ p: { xs: 4.5, md: 5.5 }, display: "flex", flexDirection: "column", gap }}>
      {(titulo || acao) && (
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 2 }}>
          {titulo && (
            <Typography id={idTitulo} variant="h2" component={nivelTitulo}>
              {titulo}
            </Typography>
          )}
          {acao}
        </Stack>
      )}
      {children}
    </Card>
  );
}
