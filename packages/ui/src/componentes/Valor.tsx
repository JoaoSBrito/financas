"use client";

import Typography, { type TypographyProps } from "@mui/material/Typography";
import { createContext, useContext, type ReactNode } from "react";
import { formatar, type Centavos } from "@financas/core";

const ContextoOcultar = createContext(false);

/** Liga ou desliga o "ocultar valores" para todos os <Valor> abaixo. */
export function ProvedorOcultarValores({ oculto, children }: { oculto: boolean; children: ReactNode }) {
  return <ContextoOcultar.Provider value={oculto}>{children}</ContextoOcultar.Provider>;
}

export function useValoresOcultos() {
  return useContext(ContextoOcultar);
}

export interface ValorProps extends Omit<TypographyProps, "children"> {
  valor: Centavos;
  /** "sempre" mostra + nos positivos (entradas, rendimentos). */
  sinal?: "padrao" | "sempre";
  /** Força mostrar mesmo com "ocultar valores" ligado. */
  ignorarOcultar?: boolean;
}

export function formatarComSinal(valor: Centavos, sinal: "padrao" | "sempre"): string {
  const texto = formatar(Math.abs(valor));
  if (valor < 0) return `− ${texto}`;
  if (sinal === "sempre" && valor > 0) return `+ ${texto}`;
  return texto;
}

export function Valor({ valor, sinal = "padrao", ignorarOcultar = false, ...props }: ValorProps) {
  const oculto = useValoresOcultos() && !ignorarOcultar;
  if (oculto) {
    return (
      <Typography component="span" aria-label="Valor oculto" {...props}>
        R$ ••••
      </Typography>
    );
  }
  return (
    <Typography component="span" {...props}>
      {formatarComSinal(valor, sinal)}
    </Typography>
  );
}
