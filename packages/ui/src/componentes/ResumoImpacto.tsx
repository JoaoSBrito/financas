"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { paleta, raio } from "../tokens";
import { estiloMono } from "./estilos";
import { Rotulo } from "./Rotulo";

export interface LinhaResumo {
  rotulo: string;
  valor: ReactNode;
}

/** Quadro no tom interativo com pares rótulo/valor: impacto nas faturas, o que será criado. */
export function ResumoImpacto({ titulo, linhas }: { titulo: string; linhas: LinhaResumo[] }) {
  return (
    <Box
      component="section"
      aria-label={titulo}
      sx={{ border: `1px dashed ${paleta.bordaControle}`, borderRadius: `${raio.painel}px`, p: 3.5, display: "flex", flexDirection: "column", gap: 2.5 }}
    >
      <Rotulo>{titulo}</Rotulo>
      <Box component="dl" sx={{ m: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        {linhas.map((l) => (
          <Box key={l.rotulo} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography component="dt" sx={{ fontSize: 14, color: "text.secondary" }}>
              {l.rotulo}
            </Typography>
            <Typography component="dd" sx={{ ...estiloMono, m: 0, fontSize: 14, textAlign: "right" }}>
              {l.valor}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
