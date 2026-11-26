"use client";

import Box from "@mui/material/Box";
import { paleta } from "../tokens";

export interface ReguaCoberturaProps {
  /** Meses cobertos (ex.: 2,9). */
  coberto: number;
  /** Meses da meta (ex.: 6). */
  meses: number;
  rotulo: string;
  altura?: number;
}

/** Régua de cobertura da reserva: um bloco por mês, o atual preenchido em parte. */
export function ReguaCobertura({ coberto, meses, rotulo, altura = 24 }: ReguaCoberturaProps) {
  return (
    <Box role="img" aria-label={rotulo} sx={{ display: "grid", gridTemplateColumns: `repeat(${meses}, minmax(0, 1fr))`, gap: 1 }}>
      {Array.from({ length: meses }, (_, i) => {
        const fracao = Math.max(0, Math.min(1, coberto - i));
        return (
          <Box key={i} sx={{ height: altura, bgcolor: paleta.divisor, display: "flex" }}>
            <Box sx={{ width: `${fracao * 100}%`, bgcolor: paleta.acao }} />
          </Box>
        );
      })}
    </Box>
  );
}
