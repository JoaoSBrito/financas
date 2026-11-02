"use client";

import Box from "@mui/material/Box";
import { LineChart } from "@mui/x-charts/LineChart";
import { formatar, nomeDoMes, type Mes } from "@financas/core";
import { useValoresOcultos } from "@financas/ui";
import { cores } from "@financas/ui/tokens";

const curto = (mes: Mes) => {
  const n = nomeDoMes(mes, false).slice(0, 3);
  return n.charAt(0).toUpperCase() + n.slice(1);
};

/** Patrimônio guardado no fim de cada mês. */
export default function GraficoEvolucao({ pontos, altura = 200 }: { pontos: { mes: Mes; total: number }[]; altura?: number }) {
  const oculto = useValoresOcultos();
  const resumo = pontos.map((p) => `${nomeDoMes(p.mes)}: ${oculto ? "valor oculto" : formatar(p.total)}`).join("; ");
  return (
    <Box role="img" aria-label={`Evolução do patrimônio. ${resumo}.`}>
      <Box aria-hidden>
        <LineChart
          height={altura}
          hideLegend
          margin={{ top: 16, bottom: 0, left: 0, right: 8 }}
          xAxis={[{ scaleType: "point", data: pontos.map((p) => curto(p.mes)), disableLine: true, disableTicks: true }]}
          yAxis={[{ position: "none" }]}
          series={[
            {
              data: pontos.map((p) => p.total),
              area: true,
              showMark: false,
              color: cores.investimento,
              valueFormatter: (v) => (oculto ? "Valor oculto" : formatar(v ?? 0)),
            },
          ]}
          sx={{ "& .MuiAreaElement-root": { fill: cores.investimentoClaro } }}
        />
      </Box>
    </Box>
  );
}
