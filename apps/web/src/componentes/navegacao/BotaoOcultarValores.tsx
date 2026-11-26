"use client";

import VisibilityOffRounded from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import IconButton from "@mui/material/IconButton";
import { paleta } from "@financas/ui/tokens";
import { usePreferencias } from "@/stores/preferencias";

export function BotaoOcultarValores() {
  const { ocultarValores, alternarOcultarValores } = usePreferencias();
  return (
    <IconButton
      onClick={alternarOcultarValores}
      aria-label={ocultarValores ? "Mostrar valores" : "Ocultar valores"}
      aria-pressed={ocultarValores}
      sx={{ border: `1px solid ${paleta.divisor}`, color: ocultarValores ? paleta.texto : paleta.textoSecundario }}
    >
      {ocultarValores ? <VisibilityOffRounded /> : <VisibilityRounded />}
    </IconButton>
  );
}
