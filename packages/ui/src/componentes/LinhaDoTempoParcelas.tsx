"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { cores } from "../tokens";

export interface LinhaDoTempoParcelasProps {
  total: number;
  /** Parcela que cai na fatura escolhida (destacada). */
  atual: number;
  /** Rótulo curto do mês de cada parcela, na ordem (ex.: "jun", "jul"...). */
  meses: string[];
  /** Nome longo de cada mês, para leitores de tela. */
  mesesAcessiveis?: string[];
}

const LEGENDA = [
  { cor: cores.borda, texto: "Já pagas (histórico)" },
  { cor: cores.primaria, texto: "Fatura escolhida" },
  { cor: "#C7D2FE", texto: "Futuras" },
];

/** Grade com todas as parcelas: as pagas, a atual e as que faltam. */
export function LinhaDoTempoParcelas({ total, atual, meses, mesesAcessiveis }: LinhaDoTempoParcelasProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box
        component="ol"
        aria-label="Linha do tempo das parcelas"
        sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))", gap: 1.5 }}
      >
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const tipo = n < atual ? "paga" : n === atual ? "atual" : "futura";
          const estado = tipo === "paga" ? "já paga" : tipo === "atual" ? "na fatura escolhida" : "futura";
          return (
            <Box
              component="li"
              key={n}
              aria-label={`Parcela ${n}, ${mesesAcessiveis?.[i] ?? meses[i] ?? ""}, ${estado}`}
              sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}
            >
              <Box
                aria-hidden
                sx={{
                  width: "100%",
                  height: 34,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: tipo === "atual" ? 800 : 700,
                  bgcolor: tipo === "paga" ? cores.borda : tipo === "atual" ? cores.primaria : "#C7D2FE",
                  color: tipo === "paga" ? cores.textoSuave : tipo === "atual" ? "#FFFFFF" : cores.destaque,
                }}
              >
                {n}
              </Box>
              <Typography
                aria-hidden
                sx={{ fontSize: 11, fontWeight: tipo === "atual" ? 700 : 400, color: tipo === "atual" ? cores.primaria : cores.textoSuave }}
              >
                {meses[i]}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Box aria-hidden sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {LEGENDA.map((l) => (
          <Box key={l.texto} sx={{ display: "flex", alignItems: "center", gap: 1.5, fontSize: 12, color: cores.textoSuave }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 0.75, bgcolor: l.cor }} />
            {l.texto}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
