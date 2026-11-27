"use client";

import Box from "@mui/material/Box";
import { paleta, tipografia } from "../tokens";

export interface PassosOnboardingProps {
  /** Passo atual, começando em 1. */
  atual: number;
  passos: string[];
}

/** Progresso em segmentos com o nome de cada passo ("01 Cartão"). O "passo X de N" vai no nome da navegação. */
export function PassosOnboarding({ atual, passos }: PassosOnboardingProps) {
  return (
    <Box component="nav" aria-label={`Primeiros passos: passo ${atual} de ${passos.length}`}>
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: `repeat(${passos.length}, minmax(0, 1fr))`, gap: 1.5 }}>
        {passos.map((nome, i) => {
          const n = i + 1;
          return (
            <Box
              component="li"
              key={nome}
              aria-current={n === atual ? "step" : undefined}
              aria-label={`${n}. ${nome}${n < atual ? ", concluído" : n === atual ? ", atual" : ""}`}
              sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
            >
              {/* Concluídos em lima, o atual em claro, os próximos no trilho. */}
              <Box aria-hidden sx={{ height: 4, bgcolor: n < atual ? paleta.acao : n === atual ? paleta.texto : paleta.divisor }} />
              <Box
                aria-hidden
                component="span"
                sx={{ fontFamily: tipografia.familiaMono, fontSize: 10, textTransform: "uppercase", color: n === atual ? paleta.texto : paleta.textoSecundario, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {String(n).padStart(2, "0")} {nome}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
