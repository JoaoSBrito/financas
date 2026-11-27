"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { estiloMono } from "./estilos";

export interface ItemLinhaDoTempoProps {
  /** Data curta (ex.: "03/12"). */
  data: string;
  tipo: "fechamento" | "vencimento";
  /** Cor do cartão: círculo vazio no fechamento, cheio no vencimento. */
  cor: string;
  titulo: string;
  /** À direita: valor ou selo. */
  fim?: ReactNode;
}

/** Linha da agenda: data, marcador e evento. Use dentro de uma lista (<ol>). */
export function ItemLinhaDoTempo({ data, tipo, cor, titulo, fim }: ItemLinhaDoTempoProps) {
  return (
    <Box component="li" sx={{ display: "grid", gridTemplateColumns: "52px 14px minmax(0, 1fr) auto", alignItems: "center", columnGap: 2, minHeight: 48 }}>
      <Box component="span" sx={{ ...estiloMono, fontSize: 12, color: "text.secondary" }}>
        {data}
      </Box>
      <Box
        component="span"
        aria-hidden
        sx={{ width: 10, height: 10, borderRadius: "50%", boxSizing: "border-box", ...(tipo === "vencimento" ? { bgcolor: cor } : { border: `2px solid ${cor}` }) }}
      />
      <Typography component="span" sx={{ fontSize: 14 }}>
        {titulo}
      </Typography>
      {fim}
    </Box>
  );
}
