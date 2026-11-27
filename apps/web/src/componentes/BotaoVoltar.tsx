"use client";

import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";

export interface BotaoVoltarProps {
  /** Rótulo acessível (ex.: "Voltar para ajustes"). */
  rotulo: string;
  /** Destino do link; sem ele, usa onClick (ex.: router.back()). */
  href?: string;
  onClick?: () => void;
  /** Só no celular: a partir de 600 px a tela é uma aba da barra superior. */
  soNoCelular?: boolean;
}

/** Seta de voltar do CabecalhoTela (44 × 44, ícone em traço). */
export function BotaoVoltar({ rotulo, href, onClick, soNoCelular = false }: BotaoVoltarProps) {
  const sx = { width: 44, height: 44, color: "text.primary", display: soNoCelular ? { xs: "inline-flex", sm: "none" } : "inline-flex", ml: { sm: -2 } };
  if (href) {
    return (
      <IconButton component={Link} href={href} aria-label={rotulo} sx={sx}>
        <ChevronLeftRounded />
      </IconButton>
    );
  }
  return (
    <IconButton aria-label={rotulo} onClick={onClick} sx={sx}>
      <ChevronLeftRounded />
    </IconButton>
  );
}
