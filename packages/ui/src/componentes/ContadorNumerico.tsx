"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import RemoveRounded from "@mui/icons-material/RemoveRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";
import { cores } from "../tokens";

export interface ContadorNumericoProps {
  valor: number;
  onChange: (valor: number) => void;
  min?: number;
  max?: number;
  /** Nome do campo para leitores de tela (ex.: "Dias antes do vencimento"). */
  rotulo: string;
  /** Texto ao lado do número (ex.: "dias", "de 10"). */
  sufixo?: ReactNode;
}

/** Botões − e + em volta de um número. */
export function ContadorNumerico({ valor, onChange, min = 0, max = Infinity, rotulo, sufixo }: ContadorNumericoProps) {
  const id = useId();
  const estiloBotao = {
    width: 48,
    height: 48,
    borderRadius: 3.5,
    border: `1px solid ${cores.bordaForte}`,
    color: cores.primaria,
  };
  return (
    <Box role="group" aria-labelledby={id} sx={{ display: "flex", alignItems: "center", gap: 3 }}>
      <Box component="span" id={id} sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {rotulo}
      </Box>
      <IconButton aria-label={`Diminuir ${rotulo.toLowerCase()}`} disabled={valor <= min} onClick={() => onChange(valor - 1)} sx={estiloBotao}>
        <RemoveRounded />
      </IconButton>
      <Typography aria-live="polite" sx={{ fontSize: 22, fontWeight: 800, minWidth: 32, textAlign: "center" }}>
        {valor}
      </Typography>
      <IconButton aria-label={`Aumentar ${rotulo.toLowerCase()}`} disabled={valor >= max} onClick={() => onChange(valor + 1)} sx={estiloBotao}>
        <AddRounded />
      </IconButton>
      {sufixo && (
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
          {sufixo}
        </Typography>
      )}
    </Box>
  );
}
