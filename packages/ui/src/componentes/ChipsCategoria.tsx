"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { cores } from "../tokens";

export interface OpcaoCategoria {
  id: string;
  nome: string;
}

export interface ChipsCategoriaProps {
  opcoes: OpcaoCategoria[];
  valor: string | null;
  /** Tocar na categoria já escolhida desmarca (fica sem categoria). */
  onChange: (id: string | null) => void;
  rotulo: string;
}

export function ChipsCategoria({ opcoes, valor, onChange, rotulo }: ChipsCategoriaProps) {
  return (
    <Box role="group" aria-label={rotulo} sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      {opcoes.map((o) => {
        const selecionada = o.id === valor;
        return (
          <Chip
            key={o.id}
            label={o.nome}
            clickable
            aria-pressed={selecionada}
            onClick={() => onChange(selecionada ? null : o.id)}
            color={selecionada ? "primary" : "default"}
            variant={selecionada ? "filled" : "outlined"}
            sx={{
              height: 40,
              px: 1,
              fontSize: 13,
              fontWeight: selecionada ? 700 : 600,
              borderColor: cores.bordaForte,
            }}
          />
        );
      })}
    </Box>
  );
}
