"use client";

import Chip from "@mui/material/Chip";
import { cores } from "../tokens";

export type StatusData = "estimado" | "confirmado";

/** Selo "Estimado" (tracejado, neutro) ou "Confirmado" (verde). */
export function SeloStatus({ status }: { status: StatusData }) {
  const confirmado = status === "confirmado";
  return (
    <Chip
      size="small"
      label={confirmado ? "Confirmado" : "Estimado"}
      variant={confirmado ? "filled" : "outlined"}
      sx={{
        fontSize: 11,
        height: 24,
        color: confirmado ? cores.investimentoEscuro : cores.textoSuave,
        bgcolor: confirmado ? cores.investimentoClaro : "transparent",
        borderStyle: confirmado ? "none" : "dashed",
        borderColor: "#9CA3AF",
      }}
    />
  );
}
