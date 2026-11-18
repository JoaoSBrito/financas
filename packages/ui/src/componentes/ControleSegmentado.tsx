"use client";

import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { paleta, raio } from "../tokens";

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
        bgcolor: paleta.interativo,
        p: 1,
        borderRadius: `${raio.pilula}px`,
        gap: 1,
        "& .MuiToggleButtonGroup-grouped": { border: "none !important", color: paleta.textoSecundario },
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
