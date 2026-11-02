"use client";

import CloseRounded from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useRouter } from "next/navigation";
import { TelaNovoGasto } from "./TelaNovoGasto";

/** Abre por cima da tela atual: tela cheia no celular, janela no desktop. */
export function ModalNovoGasto() {
  const router = useRouter();
  const tema = useTheme();
  const celular = useMediaQuery(tema.breakpoints.down("sm"));
  const fechar = () => router.back();

  return (
    <Dialog
      open
      onClose={fechar}
      fullScreen={celular}
      fullWidth
      maxWidth="sm"
      aria-labelledby="titulo-novo-gasto"
      slotProps={{ paper: { sx: { borderRadius: celular ? 0 : 6, pt: celular ? "env(safe-area-inset-top)" : 0 } } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, pt: 3 }}>
        <IconButton aria-label="Fechar" onClick={fechar}>
          <CloseRounded />
        </IconButton>
        <Typography id="titulo-novo-gasto" component="h1" sx={{ fontSize: 16, fontWeight: 800 }}>
          Novo gasto
        </Typography>
        <Box sx={{ width: 44 }} />
      </Box>
      <DialogContent sx={{ px: { xs: 5, sm: 7 }, pb: "calc(28px + env(safe-area-inset-bottom))" }}>
        <TelaNovoGasto onConcluir={fechar} />
      </DialogContent>
    </Dialog>
  );
}
