"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { Centavos } from "@financas/core";
import { paleta, semantica } from "../tokens";
import { estiloMono } from "./estilos";
import { Valor } from "./Valor";

export interface ItemMovimentoProps {
  descricao: string;
  /** Linha de apoio em caixa alta (ex.: "05/11 · RECORRENTE"). */
  detalhe: string;
  /** Com sinal: positivo é entrada. */
  valor: Centavos;
  saldoApos?: Centavos;
  corFilete?: string;
  onAbrir?: () => void;
}

/** Linha de movimento com valor e "saldo após" em colunas alinhadas. */
export function ItemMovimento({ descricao, detalhe, valor, saldoApos, corFilete, onAbrir }: ItemMovimentoProps) {
  const conteudo = (
    <Box sx={{ width: "100%", display: "grid", gridTemplateColumns: saldoApos === undefined ? "minmax(0, 1fr) auto" : "minmax(0, 1fr) 96px 92px", gap: 2, alignItems: "center", minHeight: 52, textAlign: "left" }}>
      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Typography component="span" sx={{ fontSize: 14, display: "flex", alignItems: "center", gap: 1.5 }}>
          {corFilete && <Box component="span" aria-hidden sx={{ width: 3, height: 12, bgcolor: corFilete }} />}
          {descricao}
        </Typography>
        <Box component="span" sx={{ ...estiloMono, fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", color: "text.secondary" }}>
          {detalhe}
        </Box>
      </Box>
      <Valor valor={valor} sinal="sempre" sx={{ fontSize: 13, textAlign: "right", color: valor > 0 ? semantica.receita.texto : paleta.texto }} />
      {saldoApos !== undefined && <Valor valor={saldoApos} sx={{ fontSize: 13, textAlign: "right", color: "text.secondary" }} />}
    </Box>
  );
  return onAbrir ? (
    <ButtonBase onClick={onAbrir} sx={{ width: "100%", borderRadius: 1 }}>
      {conteudo}
    </ButtonBase>
  ) : (
    conteudo
  );
}
