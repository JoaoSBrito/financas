"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import type { ReactNode } from "react";
import { paleta, raio } from "../tokens";
import { estiloMono } from "./estilos";

export interface CartaoFisicoProps {
  nome: string;
  final?: string | null;
  /** Cor de identificação (corDoCartao). */
  cor: string;
  /** Fundo escuro derivado da cor (fundoDoCartao). */
  fundo: string;
  /** 0 a 100: uso do limite. */
  percentualUso?: number;
  /** Linha de baixo (ex.: "LIVRE 4.315,10 · VENCE DIA 10"). */
  rodape?: ReactNode;
  selecionado?: boolean;
  /** Com onSelecionar, vira opção de um radiogroup. */
  onSelecionar?: () => void;
  largura?: number | string;
}

function Chip() {
  return (
    <svg width="40" height="30" viewBox="0 0 40 30" aria-hidden>
      <rect x="0.5" y="0.5" width="39" height="29" rx="5" fill="#D9C9A3" stroke="#8C7F62" />
      <path d="M0.5 10.5h12M0.5 19.5h12M27.5 10.5h12M27.5 19.5h12M12.5 0.5v29M27.5 0.5v29M12.5 15h15" fill="none" stroke="#8C7F62" />
    </svg>
  );
}

function Aproximacao() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={paleta.texto} strokeWidth={1.6} strokeLinecap="round" aria-hidden>
      <path d="M8.5 8.5a5 5 0 0 1 0 7" />
      <path d="M12 6a8.5 8.5 0 0 1 0 12" />
      <path d="M15.5 3.5a12 12 0 0 1 0 17" />
    </svg>
  );
}

/** Representação de cartão físico: chip, aproximação, número mascarado e uso do limite. */
export function CartaoFisico({ nome, final, cor, fundo, percentualUso, rodape, selecionado = false, onSelecionar, largura = "100%" }: CartaoFisicoProps) {
  const conteudo = (
    <>
      <Box aria-hidden sx={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: "50%", border: `22px solid ${cor}`, opacity: 0.18 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", position: "relative" }}>
        <Box component="span" sx={{ fontSize: 17, fontWeight: 600, letterSpacing: "0.02em" }}>
          {nome}
        </Box>
        <Aproximacao />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 3.5, position: "relative" }}>
        <Chip />
        {final && (
          <Box component="span" sx={{ ...estiloMono, fontSize: 14, letterSpacing: "0.12em" }}>
            •••• {final}
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%", position: "relative" }}>
        {percentualUso !== undefined && (
          <Box sx={{ height: 4, bgcolor: "rgba(232, 234, 237, 0.18)", display: "flex" }}>
            <Box sx={{ width: `${Math.max(0, Math.min(100, percentualUso))}%`, bgcolor: cor }} />
          </Box>
        )}
        {rodape && (
          <Box sx={{ ...estiloMono, fontSize: 11, color: paleta.textoSecundario, display: "flex", justifyContent: "space-between", gap: 2 }}>{rodape}</Box>
        )}
      </Box>
    </>
  );
  const estilo = {
    width: largura,
    aspectRatio: "1.586",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
    borderRadius: `${raio.cartaoFisico}px`,
    border: selecionado ? `2px solid ${paleta.texto}` : `1px solid ${paleta.contorno}`,
    bgcolor: fundo,
    color: paleta.texto,
    p: "16px 18px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "stretch",
    textAlign: "left",
  } as const;
  if (onSelecionar) {
    return (
      <ButtonBase role="radio" aria-checked={selecionado} aria-label={nome} onClick={onSelecionar} sx={estilo}>
        {conteudo}
      </ButtonBase>
    );
  }
  return (
    <Box role="img" aria-label={`Cartão ${nome}${final ? `, final ${final}` : ""}`} sx={estilo}>
      {conteudo}
    </Box>
  );
}
