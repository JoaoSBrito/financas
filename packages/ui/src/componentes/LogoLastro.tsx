"use client";

import Box from "@mui/material/Box";
import { paleta } from "../tokens";

/** Símbolo da Lastro (três barras, a de baixo em lima) com o nome opcional. */
export function LogoLastro({ tamanho = 22, comNome = true }: { tamanho?: number; comNome?: boolean }) {
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1.25 }}>
      <svg width={tamanho} height={tamanho} viewBox="0 0 60 60" aria-hidden={comNome ? true : undefined} role={comNome ? undefined : "img"} aria-label={comNome ? undefined : "Lastro"}>
        <rect x="8" y="12" width="24" height="8" rx="2" fill={paleta.texto} />
        <rect x="8" y="26" width="34" height="8" rx="2" fill={paleta.texto} />
        <rect x="8" y="40" width="44" height="8" rx="2" fill={paleta.acao} />
      </svg>
      {comNome && (
        <Box component="span" sx={{ fontSize: Math.round(tamanho * 0.75), fontWeight: 600, letterSpacing: "0.08em", color: paleta.texto }}>
          LASTRO
        </Box>
      )}
    </Box>
  );
}
