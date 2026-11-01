"use client";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export type TomProgresso = "primario" | "investimento" | "alerta";

const corMui = { primario: "primary", investimento: "success", alerta: "warning" } as const;

export interface BarraProgressoProps {
  /** 0 a 100 (valores acima de 100 enchem a barra). */
  percentual: number;
  rotulo: string;
  detalhe?: ReactNode;
  tom?: TomProgresso;
  /** Esconde o texto e deixa só a barra (o rótulo continua para leitores de tela). */
  compacta?: boolean;
}

export function BarraProgresso({ percentual, rotulo, detalhe, tom = "primario", compacta = false }: BarraProgressoProps) {
  const limitado = Math.max(0, Math.min(100, percentual));
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {!compacta && (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {rotulo}
          </Typography>
          {detalhe && (
            <Typography
              variant="body2"
              sx={{ color: tom === "alerta" ? "warning.main" : "text.secondary", fontWeight: tom === "alerta" ? 700 : 400 }}
            >
              {detalhe}
            </Typography>
          )}
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={limitado}
        color={corMui[tom]}
        aria-label={rotulo}
      />
    </Box>
  );
}
