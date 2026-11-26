"use client";

import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import type { Centavos } from "@financas/core";
import { paleta, tipografia } from "../tokens";
import { Rotulo } from "./Rotulo";
import { Valor } from "./Valor";

/**
 * Os tons continuam aceitos para não mudar a API. No visual Mercury,
 * "destaque" e "investimento" viram cards comuns (o destaque vem do tamanho do número)
 * e "contorno" usa borda neutra.
 */
export type TomIndicador = "padrao" | "destaque" | "investimento" | "contorno";

export interface CardIndicadorProps {
  titulo: string;
  valor: Centavos;
  detalhe?: ReactNode;
  tom?: TomIndicador;
  /** Cor do valor (ex.: verde para rendimentos, sempre com o sinal "+"). */
  corValor?: string;
  sinal?: "padrao" | "sempre";
  tamanho?: "medio" | "grande";
}

/** Número com rótulo: fatura atual, limite disponível, sobra do mês, patrimônio. */
export function CardIndicador({
  titulo,
  valor,
  detalhe,
  tom = "padrao",
  corValor,
  sinal,
  tamanho = "medio",
}: CardIndicadorProps) {
  const contorno = tom === "contorno";
  const estilo = tamanho === "grande" ? tipografia.escala.valorDestaque : tipografia.escala.valorGrande;
  return (
    <Card
      sx={{
        p: { xs: "16px", md: "20px 24px" },
        bgcolor: contorno ? "transparent" : paleta.card,
        border: contorno ? `1px solid ${paleta.bordaCampo}` : "none",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Rotulo>{titulo}</Rotulo>
      <Valor
        valor={valor}
        sinal={sinal}
        sx={{
          fontSize: estilo.tamanho,
          fontWeight: estilo.peso,
          lineHeight: estilo.alturaLinha,
          letterSpacing: `${estilo.espacamento ?? 0}em`,
          color: corValor ?? "text.primary",
        }}
      />
      {detalhe && (
        <Typography variant="caption" component="div">
          {detalhe}
        </Typography>
      )}
    </Card>
  );
}
