"use client";

import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { ReactNode } from "react";
import { paleta, tipografia, toqueMinimo } from "../tokens";

export interface OpcaoPilula<T extends string> {
  valor: T;
  rotulo: ReactNode;
  /** Nome acessível quando o rótulo visual é curto ou tem ícone. */
  rotuloAcessivel?: string;
}

export interface PilulasSelecaoProps<T extends string> {
  opcoes: OpcaoPilula<T>[];
  valor: T;
  onChange: (valor: T) => void;
  rotulo: string;
  tamanho?: "pequeno" | "medio";
}

/**
 * Pílulas de escolha única que rolam na horizontal quando não cabem
 * (cartões, meses de fatura, filtros).
 */
export function PilulasSelecao<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
  tamanho = "medio",
}: PilulasSelecaoProps<T>) {
  // As duas variações mantêm a área de toque mínima; muda só o contorno e a fonte.
  const altura = toqueMinimo;
  return (
    <Box sx={{ overflowX: "auto", mx: -1, px: 1, pb: 1, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
      <ToggleButtonGroup
        exclusive
        value={valor}
        aria-label={rotulo}
        onChange={(_, v: T | null) => v !== null && onChange(v)}
        sx={{
          gap: 1.5,
          flexWrap: "nowrap",
          "& .MuiToggleButtonGroup-grouped": {
            whiteSpace: "nowrap",
            minHeight: altura,
            px: tamanho === "pequeno" ? 3.5 : 4,
            fontSize: tamanho === "pequeno" ? 13 : 14,
            color: paleta.textoSecundario,
            // Meses (pequeno) com contorno discreto; cartões e filtros (médio) com o de controle.
            ...(tamanho === "pequeno" ? { borderColor: `${paleta.divisor} !important`, fontFamily: tipografia.familiaMono, fontSize: 12 } : {}),
          },
        }}
      >
        {opcoes.map((o) => (
          <ToggleButton key={o.valor} value={o.valor} aria-label={o.rotuloAcessivel}>
            {o.rotulo}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
