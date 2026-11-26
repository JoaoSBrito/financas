"use client";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { estiloMono } from "./estilos";

/** "estouro" é novo (orçamento a partir de 100%); os demais seguem iguais. */
export type TomProgresso = "primario" | "investimento" | "alerta" | "estouro";

const corMui = { primario: "primary", investimento: "success", alerta: "warning", estouro: "error" } as const;
const corTexto = { primario: "text.secondary", investimento: "text.secondary", alerta: "warning.main", estouro: "error.main" } as const;

export interface BarraProgressoProps {
  /** 0 a 100 (valores acima de 100 enchem a barra). */
  percentual: number;
  rotulo: string;
  detalhe?: ReactNode;
  tom?: TomProgresso;
  /** Esconde o texto e deixa só a barra (o rótulo continua para leitores de tela). */
  compacta?: boolean;
}

/** Barra fina (4px). A cor reforça, mas o percentual escrito em `detalhe` é o indicador. */
export function BarraProgresso({ percentual, rotulo, detalhe, tom = "primario", compacta = false }: BarraProgressoProps) {
  const limitado = Math.max(0, Math.min(100, percentual));
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {!compacta && (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Typography sx={{ fontSize: 14 }}>{rotulo}</Typography>
          {detalhe && <Typography sx={{ ...estiloMono, fontSize: 13, color: corTexto[tom], textAlign: "right" }}>{detalhe}</Typography>}
        </Box>
      )}
      <LinearProgress variant="determinate" value={limitado} color={corMui[tom]} aria-label={rotulo} />
    </Box>
  );
}
