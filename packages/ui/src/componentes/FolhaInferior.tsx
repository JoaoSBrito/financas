"use client";

import CloseRounded from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";
import { paleta } from "../tokens";
import { Rotulo } from "./Rotulo";

export interface FolhaInferiorProps {
  aberta: boolean;
  onFechar: () => void;
  titulo: string;
  /** Linha de contexto acima do título (ex.: "XP · FATURA DE NOVEMBRO"). */
  contexto?: ReactNode;
  children: ReactNode;
  /** Ações no rodapé (Cancelar + ação principal). */
  acoes?: ReactNode;
  /** Largura no desktop. */
  largura?: number;
  /** Bloqueia fechar pelo véu (ex.: enquanto salva). */
  ocupado?: boolean;
  /** Envolve o conteúdo num formulário. */
  onEnviar?: () => void;
}

/** Folha inferior no celular e diálogo centralizado a partir de 600 px. */
export function FolhaInferior({ aberta, onFechar, titulo, contexto, children, acoes, largura = 520, ocupado = false, onEnviar }: FolhaInferiorProps) {
  const id = useId();
  const corpo = (
    <>
      <Box aria-hidden sx={{ display: { xs: "block", sm: "none" }, alignSelf: "center", width: 36, height: 4, bgcolor: paleta.bordaControle, mt: 2.5 }} />
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, px: { xs: 4, sm: 6 }, pt: { xs: 3, sm: 5 } }}>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          {contexto && <Rotulo>{contexto}</Rotulo>}
          <Typography id={id} component="h2" sx={{ fontSize: 20, fontWeight: 500 }}>
            {titulo}
          </Typography>
        </Box>
        <IconButton aria-label="Fechar" onClick={onFechar} disabled={ocupado} sx={{ display: { xs: "none", sm: "inline-flex" }, mr: -2 }}>
          <CloseRounded />
        </IconButton>
      </Box>
      <Box sx={{ px: { xs: 4, sm: 6 }, py: 4, display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>{children}</Box>
      {acoes && (
        <Box sx={{ px: { xs: 4, sm: 6 }, pb: { xs: "calc(20px + env(safe-area-inset-bottom))", sm: 5 }, pt: 1, display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(0, 1fr)", gap: 2 }}>
          {acoes}
        </Box>
      )}
    </>
  );
  return (
    <Dialog
      open={aberta}
      onClose={ocupado ? undefined : onFechar}
      aria-labelledby={id}
      sx={{ "& .MuiDialog-container": { alignItems: { xs: "flex-end", sm: "center" } } }}
      slotProps={{
        paper: {
          sx: {
            m: { xs: 0, sm: 4 },
            width: { xs: "100%", sm: largura },
            maxWidth: { xs: "100%", sm: largura },
            maxHeight: { xs: "92dvh", sm: "calc(100% - 64px)" },
            borderRadius: { xs: "10px 10px 0 0", sm: "10px" },
            borderBottom: { xs: "none", sm: undefined },
          },
        },
      }}
    >
      {onEnviar ? (
        <Box
          component="form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onEnviar();
          }}
          sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          {corpo}
        </Box>
      ) : (
        corpo
      )}
    </Dialog>
  );
}
