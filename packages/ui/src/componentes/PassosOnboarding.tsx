"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { cores } from "../tokens";

export interface PassosOnboardingProps {
  /** Passo atual, começando em 1. */
  atual: number;
  passos: string[];
}

/** Barra de progresso em segmentos com "Passo X de N". */
export function PassosOnboarding({ atual, passos }: PassosOnboardingProps) {
  return (
    <Box component="nav" aria-label="Progresso dos primeiros passos" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: `repeat(${passos.length}, minmax(0, 1fr))`, gap: 1.5 }}>
        {passos.map((nome, i) => {
          const n = i + 1;
          return (
            <Box
              component="li"
              key={nome}
              aria-current={n === atual ? "step" : undefined}
              aria-label={`${n}. ${nome}${n < atual ? ", concluído" : ""}`}
              sx={{ height: 6, borderRadius: 1, bgcolor: n <= atual ? cores.primaria : cores.bordaForte }}
            />
          );
        })}
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
        Passo {atual} de {passos.length}
      </Typography>
    </Box>
  );
}
