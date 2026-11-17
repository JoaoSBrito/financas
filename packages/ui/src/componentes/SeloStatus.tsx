"use client";

import Chip from "@mui/material/Chip";
import { raio, semantica } from "../tokens";

export type StatusData = "estimado" | "confirmado";

/** Selo "Estimado" (tracejado, neutro) ou "Confirmado" (verde sobre fundo suave). O texto é o indicador. */
export function SeloStatus({ status }: { status: StatusData }) {
  const confirmado = status === "confirmado";
  return (
    <Chip
      size="small"
      label={confirmado ? "Confirmado" : "Estimado"}
      variant={confirmado ? "filled" : "outlined"}
      sx={{
        fontSize: 11,
        height: 22,
        borderRadius: `${raio.chip}px`,
        color: confirmado ? semantica.confirmado.texto : semantica.estimado.texto,
        bgcolor: confirmado ? semantica.confirmado.fundo : "transparent",
        border: confirmado ? "none" : `1px ${semantica.estimado.estiloBorda} ${semantica.estimado.borda}`,
      }}
    />
  );
}
