"use client";

import Box from "@mui/material/Box";
import { paleta } from "../tokens";

export interface BarraParcelasProps {
  total: number;
  /** Parcela que está na fatura atual (1 a total). */
  atual: number;
}

/** Barra segmentada: parcelas até a atual em destaque, as futuras no tom interativo. */
export function BarraParcelas({ total, atual }: BarraParcelasProps) {
  return (
    <Box role="img" aria-label={`Parcela ${atual} de ${total}`} sx={{ display: "flex", gap: "3px" }}>
      {Array.from({ length: total }, (_, i) => (
        <Box
          key={i + 1}
          sx={{
            flex: 1,
            height: 6,
            boxSizing: "border-box",
            // Pagas em claro, a atual em lima, as futuras só com contorno.
            ...(i + 1 < atual
              ? { bgcolor: paleta.texto }
              : i + 1 === atual
                ? { bgcolor: paleta.acao }
                : { border: `1px solid ${paleta.bordaControle}` }),
          }}
        />
      ))}
    </Box>
  );
}
