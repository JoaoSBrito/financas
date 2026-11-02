"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { formatarDiaMes, type Centavos, type Data } from "@financas/core";
import { cores } from "../tokens";
import { Valor } from "./Valor";

export interface CardSaldoProjetadoProps {
  ate: Data;
  saldoFinal: Centavos;
  saldoHoje: Centavos;
  entradas: Centavos;
  faturas: Centavos;
  contasFixas: Centavos;
  outros?: Centavos;
  /** Só o valor e uma linha de apoio (Início no celular). */
  compacto?: boolean;
  /** Ex.: seta indicando que o card leva para Contas. */
  acessorio?: ReactNode;
}

function Linha({ rotulo, valor, sinal, cor }: { rotulo: string; valor: Centavos; sinal?: "sempre"; cor?: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
      <Typography component="dt" variant="body2" sx={{ color: "text.secondary" }}>
        {rotulo}
      </Typography>
      <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 700, color: cor }}>
        <Valor valor={valor} sinal={sinal} sx={{ font: "inherit" }} />
      </Typography>
    </Box>
  );
}

/** "Sobra em 30/11": saldo de hoje + entradas previstas − faturas − contas fixas. */
export function CardSaldoProjetado({
  ate,
  saldoFinal,
  saldoHoje,
  entradas,
  faturas,
  contasFixas,
  outros = 0,
  compacto = false,
  acessorio,
}: CardSaldoProjetadoProps) {
  const negativo = saldoFinal < 0;
  return (
    <Card
      component="section"
      aria-label={`Sobra em ${formatarDiaMes(ate)}`}
      sx={{ p: 5, border: `2px solid ${negativo ? cores.erro : cores.primaria}`, display: "flex", flexDirection: "column", gap: 3 }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle2" sx={{ color: negativo ? cores.erro : cores.primaria, fontWeight: 700 }}>
          Sobra em {formatarDiaMes(ate)}
        </Typography>
        {acessorio}
      </Box>
      <Valor
        valor={saldoFinal}
        component="p"
        sx={{ m: 0, fontSize: compacto ? 28 : 34, fontWeight: 800, letterSpacing: "-0.5px", color: negativo ? cores.erro : undefined }}
      />
      {compacto ? (
        <Typography variant="caption" component="p">
          Saldo hoje <Valor valor={saldoHoje} sx={{ font: "inherit" }} />
          {entradas > 0 && (
            <>
              {" "}· entram <Valor valor={entradas} sx={{ font: "inherit" }} />
            </>
          )}
        </Typography>
      ) : (
        <Box component="dl" sx={{ m: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <Linha rotulo="Saldo hoje" valor={saldoHoje} />
          <Linha rotulo="Entradas previstas" valor={entradas} sinal="sempre" cor={cores.investimento} />
          <Linha rotulo="Faturas a pagar" valor={-faturas} />
          <Linha rotulo="Contas fixas" valor={-contasFixas} />
          {outros !== 0 && <Linha rotulo="Já agendados" valor={outros} sinal="sempre" />}
        </Box>
      )}
    </Card>
  );
}
