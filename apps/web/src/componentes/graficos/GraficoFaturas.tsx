"use client";

import Box from "@mui/material/Box";
import { BarChart } from "@mui/x-charts/BarChart";
import { formatar, nomeDoMes, type Mes } from "@financas/core";
import { useValoresOcultos } from "@financas/ui";
import { grafico, paleta, tipografia } from "@financas/ui/tokens";

export interface GraficoFaturasProps {
  meses: { mes: Mes; total: number; aberta: boolean }[];
  altura?: number;
}

const curto = (mes: Mes) => {
  const n = nomeDoMes(mes, false).slice(0, 3);
  return n.charAt(0).toUpperCase() + n.slice(1);
};

/** Barras das próximas faturas; a fatura aberta fica em destaque. */
export default function GraficoFaturas({ meses, altura = 200 }: GraficoFaturasProps) {
  const oculto = useValoresOcultos();
  const rotulo = (centavos: number) => {
    if (oculto) return "••••";
    const reais = centavos / 100;
    return reais >= 1000 ? `${(reais / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : reais.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  };
  const resumo = meses.map((m) => `${nomeDoMes(m.mes)}: ${oculto ? "valor oculto" : formatar(m.total)}`).join("; ");

  return (
    <Box role="img" aria-label={`Próximas faturas. ${resumo}.`}>
      <Box aria-hidden>
        <BarChart
          height={altura}
          hideLegend
          borderRadius={8}
          margin={{ top: 24, bottom: 0, left: 0, right: 0 }}
          xAxis={[
            {
              scaleType: "band",
              data: meses.map((m) => curto(m.mes)),
              disableLine: true,
              disableTicks: true,
              categoryGapRatio: 0.35,
              colorMap: {
                type: "ordinal",
                values: meses.map((m) => curto(m.mes)),
                colors: meses.map((m) => (m.aberta ? grafico.destaque : grafico.inativo)),
              },
            },
          ]}
          yAxis={[{ position: "none" }]}
          series={[
            {
              data: meses.map((m) => m.total),
              barLabel: (item) => rotulo(item.value ?? 0),
              barLabelPlacement: "outside",
              valueFormatter: (v) => (oculto ? "Valor oculto" : formatar(v ?? 0)),
            },
          ]}
          sx={{
            "& .MuiBarLabel-root": { fontSize: tipografia.escala.legenda.tamanho, fontWeight: 400, fill: paleta.texto },
            "& .MuiChartsAxis-tickLabel": { fill: paleta.textoSecundario },
          }}
        />
      </Box>
    </Box>
  );
}
