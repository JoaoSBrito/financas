"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { cores } from "../tokens";

export interface LinhaResumo {
  rotulo: string;
  valor: ReactNode;
}

/** Quadro cinza com pares rótulo/valor: impacto nas faturas, o que será criado. */
export function ResumoImpacto({ titulo, linhas }: { titulo: string; linhas: LinhaResumo[] }) {
  return (
    <Box
      component="section"
      aria-label={titulo}
      sx={{ bgcolor: cores.fundo, borderRadius: 4, p: 4, display: "flex", flexDirection: "column", gap: 2.5 }}
    >
      <Typography variant="body2" sx={{ fontWeight: 800 }}>
        {titulo}
      </Typography>
      <Box component="dl" sx={{ m: 0, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {linhas.map((l) => (
          <Box key={l.rotulo} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography component="dt" variant="body2" sx={{ color: "text.secondary" }}>
              {l.rotulo}
            </Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 700, textAlign: "right" }}>
              {l.valor}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
