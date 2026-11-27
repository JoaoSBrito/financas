"use client";

import InboxRounded from "@mui/icons-material/InboxRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { paleta, semantica } from "../tokens";
import { estiloPainel } from "./estilos";
import { Rotulo } from "./Rotulo";
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
      <Box aria-hidden sx={{ width: 48, height: 48, border: `1px dashed ${paleta.bordaControle}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <InboxRounded sx={{ fontSize: 22, color: "text.primary" }} />
      </Box>
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
  /** O que fazer a seguir. */
  descricao?: string;
  onTentarNovamente?: () => void;
  /** Dentro de um painel que já existe (sem borda própria). */
  embutido?: boolean;
}

/** Erro ao carregar: painel com rótulo em coral, a mensagem e como resolver. */
export function EstadoErro({ mensagem, descricao = "Verifique a conexão e tente de novo.", onTentarNovamente, embutido = false }: EstadoErroProps) {
  return (
    <Box
      role="alert"
      sx={{ ...(embutido ? {} : estiloPainel), textAlign: "center", py: embutido ? 4 : 8, px: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
    >
      <Rotulo sx={{ color: semantica.estouro.texto }}>Erro ao carregar</Rotulo>
      <Typography variant="h3" component="p">
        {mensagem}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 320 }}>
        {descricao}
      </Typography>
      {onTentarNovamente && (
        <Button variant="outlined" onClick={onTentarNovamente} sx={{ mt: 2 }}>
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
          <Skeleton variant="rectangular" width={4} height={28} />
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
