"use client";

import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import type { Centavos } from "@financas/core";
import { cores } from "../tokens";
import { Valor } from "./Valor";

export type TomIndicador = "padrao" | "destaque" | "investimento" | "contorno";

export interface CardIndicadorProps {
  titulo: string;
  valor: Centavos;
  detalhe?: ReactNode;
  tom?: TomIndicador;
  /** Cor do valor (ex.: verde para rendimentos). */
  corValor?: string;
  sinal?: "padrao" | "sempre";
  tamanho?: "medio" | "grande";
}

const estilos: Record<TomIndicador, { bg: string; texto: string; suave: string; borda?: string }> = {
  padrao: { bg: cores.superficie, texto: cores.texto, suave: cores.textoSuave },
  destaque: { bg: cores.destaque, texto: "#FFFFFF", suave: "#E0E7FF" },
  investimento: { bg: cores.investimentoEscuro, texto: "#FFFFFF", suave: cores.investimentoClaro },
  contorno: { bg: cores.superficie, texto: cores.texto, suave: cores.textoSuave, borda: cores.primaria },
};

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
  const e = estilos[tom];
  return (
    <Card
      sx={{
        p: 5,
        bgcolor: e.bg,
        color: e.texto,
        border: e.borda ? `2px solid ${e.borda}` : "none",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ color: tom === "contorno" ? cores.primaria : e.suave, fontWeight: tom === "contorno" ? 700 : 600 }}
      >
        {titulo}
      </Typography>
      <Valor
        valor={valor}
        sinal={sinal}
        sx={{
          fontSize: tamanho === "grande" ? { xs: 34, md: 36 } : 28,
          fontWeight: 800,
          letterSpacing: "-0.5px",
          color: corValor ?? "inherit",
        }}
      />
      {detalhe && (
        <Typography variant="caption" component="div" sx={{ color: e.suave }}>
          {detalhe}
        </Typography>
      )}
    </Card>
  );
}
