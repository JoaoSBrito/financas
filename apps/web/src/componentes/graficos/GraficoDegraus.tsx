"use client";

import Box from "@mui/material/Box";
import { formatar, formatarDiaMes, type Data } from "@financas/core";
import { useValoresOcultos } from "@financas/ui";
import { grafico, paleta, tipografia } from "@financas/ui/tokens";

export interface PontoSaldo {
  data: Data;
  saldo: number;
}

/**
 * Saldo ao longo do mês em degraus: começa no saldo de hoje e muda a cada
 * movimento previsto (o mesmo cálculo da projeção, só desenhado).
 */
export default function GraficoDegraus({ hoje, ate, saldoHoje, pontos, altura = 64 }: { hoje: Data; ate: Data; saldoHoje: number; pontos: PontoSaldo[]; altura?: number }) {
  const oculto = useValoresOcultos();
  const largura = 358;
  const inicio = Date.parse(`${hoje}T00:00:00Z`);
  const fim = Math.max(inicio + 86_400_000, Date.parse(`${ate}T00:00:00Z`));
  const valores = [saldoHoje, ...pontos.map((p) => p.saldo)];
  const min = Math.min(0, ...valores);
  const max = Math.max(...valores, 1);
  const x = (d: Data) => ((Date.parse(`${d}T00:00:00Z`) - inicio) / (fim - inicio)) * largura;
  const y = (v: number) => 4 + (1 - (v - min) / (max - min || 1)) * (altura - 8);
  let caminho = `M0 ${y(saldoHoje).toFixed(1)}`;
  for (const p of pontos) caminho += ` H${x(p.data).toFixed(1)} V${y(p.saldo).toFixed(1)}`;
  caminho += ` H${largura}`;
  const final = pontos.length ? pontos[pontos.length - 1]!.saldo : saldoHoje;
  const resumo = oculto
    ? "Saldo ao longo do mês (valores ocultos)"
    : `Saldo ao longo do mês: ${formatar(saldoHoje)} hoje, chega a ${formatar(max)} no ponto mais alto e termina em ${formatar(final)} em ${formatarDiaMes(ate)}`;
  return (
    <Box>
      <Box component="svg" viewBox={`0 0 ${largura} ${altura}`} preserveAspectRatio="none" role="img" aria-label={resumo} sx={{ display: "block", width: "100%", height: altura }}>
        <path d={`${caminho} V${altura} H0 Z`} fill={grafico.area} />
        <path d={caminho} fill="none" stroke={grafico.linha} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        {min < 0 && <line x1="0" x2={largura} y1={y(0)} y2={y(0)} stroke={paleta.bordaControle} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
      </Box>
      <Box aria-hidden sx={{ display: "flex", justifyContent: "space-between", fontFamily: tipografia.familiaMono, fontSize: 10, color: paleta.textoSecundario, pt: 1 }}>
        <span>{formatarDiaMes(hoje)}</span>
        <span>{formatarDiaMes(ate)}</span>
      </Box>
    </Box>
  );
}
