"use client";

import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import InboxRounded from "@mui/icons-material/InboxRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export interface EstadoVazioProps {
  titulo: string;
  descricao?: string;
  /** Botão ou link que resolve o vazio (ex.: "Cadastrar cartão"). */
  acao?: ReactNode;
}

export function EstadoVazio({ titulo, descricao, acao }: EstadoVazioProps) {
  return (
    <Box sx={{ textAlign: "center", py: 8, px: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <InboxRounded aria-hidden sx={{ fontSize: 40, color: "text.secondary" }} />
      <Typography variant="h3" component="p">
        {titulo}
      </Typography>
      {descricao && (
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 320 }}>
          {descricao}
        </Typography>
      )}
      {acao && <Box sx={{ mt: 2 }}>{acao}</Box>}
    </Box>
  );
}

export interface EstadoErroProps {
  mensagem: string;
  onTentarNovamente?: () => void;
}

export function EstadoErro({ mensagem, onTentarNovamente }: EstadoErroProps) {
  return (
    <Box
      role="alert"
      sx={{ textAlign: "center", py: 8, px: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
    >
      <ErrorOutlineRounded aria-hidden sx={{ fontSize: 40, color: "error.main" }} />
      <Typography variant="body1" sx={{ fontWeight: 700 }}>
        {mensagem}
      </Typography>
      {onTentarNovamente && (
        <Button variant="outlined" onClick={onTentarNovamente}>
          Tentar de novo
        </Button>
      )}
    </Box>
  );
}

/** Esqueleto de lista enquanto os dados carregam. */
export function CarregandoLista({ linhas = 3 }: { linhas?: number }) {
  return (
    <Box aria-busy="true" aria-label="Carregando" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {Array.from({ length: linhas }, (_, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Skeleton variant="rounded" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" />
            <Skeleton width="35%" />
          </Box>
          <Skeleton width={72} />
        </Box>
      ))}
    </Box>
  );
}
