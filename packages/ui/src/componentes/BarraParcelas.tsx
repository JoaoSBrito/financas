"use client";

import Box from "@mui/material/Box";
import { cores } from "../tokens";

export interface BarraParcelasProps {
  total: number;
  /** Parcela que está na fatura atual (1 a total). */
  atual: number;
}

/** Barra segmentada: parcelas pagas, a atual e as futuras. */
export function BarraParcelas({ total, atual }: BarraParcelasProps) {
  return (
    <Box role="img" aria-label={`Parcela ${atual} de ${total}`} sx={{ display: "flex", gap: "3px" }}>
      {Array.from({ length: total }, (_, i) => {
        const numero = i + 1;
        const cor = numero <= atual ? cores.primaria : cores.borda;
        return <Box key={numero} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: cor }} />;
      })}
    </Box>
  );
}
