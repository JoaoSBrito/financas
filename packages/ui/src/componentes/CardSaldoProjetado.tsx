"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { formatarDiaMes, type Centavos, type Data } from "@financas/core";
import { paleta, semantica, tipografia } from "../tokens";
import { estiloMono } from "./estilos";
import { Rotulo } from "./Rotulo";
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
  /** Gráfico opcional abaixo do valor (ex.: saldo ao longo do mês). */
  grafico?: ReactNode;
  /** Ex.: seta indicando que o card leva para Contas. */
  acessorio?: ReactNode;
}

function Linha({ rotulo, valor, sinal, cor }: { rotulo: string; valor: Centavos; sinal?: "sempre"; cor?: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
      <Typography component="dt" variant="body2" sx={{ color: "text.secondary" }}>
        {rotulo}
      </Typography>
      <Typography component="dd" variant="body2" sx={{ ...estiloMono, m: 0, color: cor }}>
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
  grafico,
  acessorio,
}: CardSaldoProjetadoProps) {
  const negativo = saldoFinal < 0;
  return (
    <Card
      component="section"
      aria-label={`Sobra em ${formatarDiaMes(ate)}`}
      sx={{ p: { xs: "16px", md: "20px 24px" }, border: `1px solid ${negativo ? semantica.estouro.texto : paleta.divisor}`, display: "flex", flexDirection: "column", gap: 3 }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Rotulo sx={{ color: negativo ? semantica.estouro.texto : undefined }}>Sobra em {formatarDiaMes(ate)}</Rotulo>
        {acessorio}
      </Box>
      <Valor
        valor={saldoFinal}
        component="p"
        sx={{ m: 0, fontSize: compacto ? 26 : 36, fontWeight: 500, lineHeight: 1.1, letterSpacing: `${tipografia.escala.valorDestaque.espacamento}em`, color: negativo ? semantica.estouro.texto : undefined }}
      />
      {grafico}
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
          <Linha rotulo="Entradas previstas" valor={entradas} sinal="sempre" cor={semantica.receita.texto} />
          <Linha rotulo="Faturas a pagar" valor={-faturas} />
          <Linha rotulo="Contas fixas" valor={-contasFixas} />
          {outros !== 0 && <Linha rotulo="Já agendados" valor={outros} sinal="sempre" />}
          <Box sx={{ borderTop: `1px solid ${paleta.contorno}`, pt: 2, display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography component="dt" sx={{ fontSize: 14 }}>
              Sobra
            </Typography>
            <Typography component="dd" sx={{ ...estiloMono, m: 0, fontSize: 14, fontWeight: 500 }}>
              = <Valor valor={saldoFinal} sx={{ font: "inherit" }} />
            </Typography>
          </Box>
        </Box>
      )}
    </Card>
  );
}
