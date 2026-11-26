"use client";

import Box from "@mui/material/Box";
import { paleta } from "../tokens";
import { estiloRotulo } from "./estilos";

export interface SegmentoBarra {
  rotulo: string;
  valor: number;
  cor: string;
}

export interface BarraSegmentadaProps {
  /** Descrição para leitores de tela (ex.: "Limite: 30% na fatura, 16% em parcelas"). */
  rotulo: string;
  segmentos: SegmentoBarra[];
  /** Total da barra; o que sobrar fica no trilho (ex.: limite livre). */
  total: number;
  blocos?: number;
  altura?: number;
  /** Rótulo da parte vazia na legenda (ex.: "Livre"). */
  rotuloRestante?: string;
  legenda?: boolean;
}

/** Barra em blocos (ex.: limite = fatura + parcelas + livre), com legenda opcional. */
export function BarraSegmentada({ rotulo, segmentos, total, blocos = 20, altura = 8, rotuloRestante, legenda = false }: BarraSegmentadaProps) {
  const cores: string[] = [];
  let acumulado = 0;
  for (const s of segmentos) {
    acumulado += s.valor;
    const ate = total > 0 ? Math.round((acumulado / total) * blocos) : 0;
    while (cores.length < Math.min(ate, blocos)) cores.push(s.cor);
  }
  while (cores.length < blocos) cores.push(paleta.divisor);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box role="img" aria-label={rotulo} sx={{ display: "grid", gridTemplateColumns: `repeat(${blocos}, minmax(0, 1fr))`, gap: "2px" }}>
        {cores.map((cor, i) => (
          <Box key={i} sx={{ height: altura, bgcolor: cor }} />
        ))}
      </Box>
      {legenda && (
        <Box aria-hidden sx={{ display: "flex", flexWrap: "wrap", gap: 3.5 }}>
          {segmentos.map((s) => (
            <Box key={s.rotulo} component="span" sx={{ ...estiloRotulo, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box component="span" sx={{ width: 8, height: 8, bgcolor: s.cor }} />
              {s.rotulo}
            </Box>
          ))}
          {rotuloRestante && (
            <Box component="span" sx={{ ...estiloRotulo, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box component="span" sx={{ width: 8, height: 8, bgcolor: paleta.divisor, outline: `1px solid ${paleta.bordaControle}` }} />
              {rotuloRestante}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
