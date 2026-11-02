"use client";

import Snackbar from "@mui/material/Snackbar";
import { useAvisos } from "@/stores/avisos";

export function AvisoGlobal() {
  const { mensagem, fechar } = useAvisos();
  return (
    <Snackbar
      open={Boolean(mensagem)}
      autoHideDuration={4000}
      onClose={(_, motivo) => motivo !== "clickaway" && fechar()}
      message={mensagem}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      // No celular, fica acima da barra inferior.
      sx={{ bottom: { xs: "calc(96px + env(safe-area-inset-bottom))", sm: 24 } }}
    />
  );
}
