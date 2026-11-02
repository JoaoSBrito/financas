"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import type { Centavos } from "@financas/core";
import { cores, toqueMinimo } from "../tokens";
import { Valor } from "./Valor";

export interface ItemLancamentoProps {
  descricao: string;
  detalhe?: ReactNode;
  valor: Centavos;
  icone?: ReactNode;
  /** Quando definido, mostra a caixa de "conferido com o banco". */
  conferido?: boolean;
  onConferir?: (conferido: boolean) => void;
  sinal?: "padrao" | "sempre";
  corValor?: string;
  /** Texto à direita no lugar do valor principal (ex.: saldo após). */
  extra?: ReactNode;
  /** Torna a linha tocável (ex.: abrir edição). A caixa de conferido continua separada. */
  onAbrir?: () => void;
}

/** Linha de lista usada em gastos, lançamentos da fatura e movimentos da conta. */
export function ItemLancamento({
  descricao,
  detalhe,
  valor,
  icone,
  conferido,
  onConferir,
  sinal,
  corValor,
  extra,
  onAbrir,
}: ItemLancamentoProps) {
  const conteudo = (
    <>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", textAlign: "left" }}>
        <Typography variant="subtitle1" noWrap>
          {descricao}
        </Typography>
        {detalhe && (
          <Typography variant="caption" component="div">
            {detalhe}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Valor valor={valor} sinal={sinal} sx={{ fontSize: 14, fontWeight: 700, color: corValor ?? "inherit" }} />
        {extra}
      </Box>
    </>
  );
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 3, minHeight: 52 }}>
      {conferido !== undefined && (
        <Checkbox
          checked={conferido}
          onChange={(e) => onConferir?.(e.target.checked)}
          slotProps={{ input: { "aria-label": `Conferido: ${descricao}` } }}
          sx={{ ml: -2.5, width: toqueMinimo, height: toqueMinimo }}
        />
      )}
      {icone && (
        <Box
          aria-hidden
          sx={{
            width: 40,
            height: 40,
            borderRadius: 3,
            bgcolor: cores.primariaClara,
            color: cores.primaria,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icone}
        </Box>
      )}
      {onAbrir ? (
        <ButtonBase
          onClick={onAbrir}
          sx={{ flex: 1, minWidth: 0, gap: 3, minHeight: 52, borderRadius: 2, justifyContent: "space-between" }}
        >
          {conteudo}
        </ButtonBase>
      ) : (
        conteudo
      )}
    </Box>
  );
}
