"use client";

import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { cores } from "../tokens";

export interface OpcaoSegmentada<T extends string> {
  valor: T;
  rotulo: string;
}

export interface ControleSegmentadoProps<T extends string> {
  opcoes: OpcaoSegmentada<T>[];
  valor: T;
  onChange: (valor: T) => void;
  rotulo: string;
}

/** Escolha entre poucas opções exclusivas (ex.: "Úteis | Corridos"). */
export function ControleSegmentado<T extends string>({ opcoes, valor, onChange, rotulo }: ControleSegmentadoProps<T>) {
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      value={valor}
      onChange={(_, v: T | null) => v !== null && onChange(v)}
      aria-label={rotulo}
      sx={{
        bgcolor: cores.borda,
        p: 1,
        borderRadius: 3.5,
        gap: 1,
        "& .MuiToggleButton-root": { border: "none", borderRadius: "10px !important", color: cores.textoSuave },
        "& .Mui-selected": { bgcolor: `${cores.superficie} !important`, color: `${cores.texto} !important`, fontWeight: 700 },
      }}
    >
      {opcoes.map((o) => (
        <ToggleButton key={o.valor} value={o.valor}>
          {o.rotulo}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
