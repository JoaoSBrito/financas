"use client";

import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useState } from "react";
import { cores } from "../tokens";
import { ContadorNumerico } from "./ContadorNumerico";

const RAPIDAS = [1, 3, 6, 10, 12];

export interface SeletorParcelasProps {
  valor: number;
  onChange: (parcelas: number) => void;
  max?: number;
}

/** Atalhos de parcelas (À vista, 3x, 6x...) e "Outro" com contador. */
export function SeletorParcelas({ valor, onChange, max = 48 }: SeletorParcelasProps) {
  const [outro, setOutro] = useState(!RAPIDAS.includes(valor));
  const selecionado = outro ? "outro" : String(valor);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <ToggleButtonGroup
        exclusive
        value={selecionado}
        aria-label="Parcelas"
        onChange={(_, v: string | null) => {
          if (v === null) return;
          if (v === "outro") {
            setOutro(true);
            if (RAPIDAS.includes(valor)) onChange(2);
          } else {
            setOutro(false);
            onChange(Number(v));
          }
        }}
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: 1.5,
          "& .MuiToggleButton-root": {
            border: `1px solid ${cores.bordaForte} !important`,
            borderRadius: "12px !important",
            minHeight: 44,
            px: 0,
            fontSize: 13,
          },
          "& .Mui-selected": {
            bgcolor: `${cores.primaria} !important`,
            color: "#FFFFFF !important",
            borderColor: `${cores.primaria} !important`,
            fontWeight: 700,
          },
        }}
      >
        {RAPIDAS.map((n) => (
          <ToggleButton key={n} value={String(n)}>
            {n === 1 ? "À vista" : `${n}x`}
          </ToggleButton>
        ))}
        <ToggleButton value="outro">Outro</ToggleButton>
      </ToggleButtonGroup>
      {outro && (
        <ContadorNumerico rotulo="Número de parcelas" valor={valor} min={2} max={max} onChange={onChange} sufixo="parcelas" />
      )}
    </Box>
  );
}
