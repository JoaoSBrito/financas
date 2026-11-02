"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { TelaNovoGasto } from "./TelaNovoGasto";

function voltar(router: ReturnType<typeof useRouter>) {
  if (window.history.length > 1) router.back();
  else router.push("/");
}

/** Acesso direto pelo endereço /gastos/novo (sem modal). */
export function PaginaNovoGasto() {
  const router = useRouter();
  return (
    <Box sx={{ maxWidth: 560, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 5, ml: -2 }}>
        <IconButton aria-label="Voltar" onClick={() => voltar(router)}>
          <ArrowBackRounded />
        </IconButton>
        <Typography variant="h1">Novo gasto</Typography>
      </Box>
      <TelaNovoGasto onConcluir={() => voltar(router)} />
    </Box>
  );
}
