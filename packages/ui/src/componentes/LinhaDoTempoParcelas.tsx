"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { paleta, tipografia } from "../tokens";

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
  { cor: paleta.divisor, borda: undefined, texto: "Já pagas (histórico)" },
  { cor: paleta.texto, borda: undefined, texto: "Fatura escolhida" },
  { cor: "transparent", borda: paleta.bordaControle, texto: "Futuras" },
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
                  height: 32,
                  boxSizing: "border-box",
                  border: tipo === "futura" ? `1px solid ${paleta.bordaControle}` : "none",
                  fontFamily: tipografia.familiaMono,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: tipo === "atual" ? 500 : 400,
                  bgcolor: tipo === "paga" ? paleta.divisor : tipo === "atual" ? paleta.texto : "transparent",
                  color: tipo === "paga" ? paleta.textoSecundario : tipo === "atual" ? paleta.sobreClaro : paleta.texto,
                }}
              >
                {String(n).padStart(2, "0")}
              </Box>
              <Typography
                aria-hidden
                sx={{ fontFamily: tipografia.familiaMono, textTransform: "uppercase", fontSize: 10, fontWeight: tipo === "atual" ? 500 : 400, color: tipo === "atual" ? paleta.texto : paleta.textoSecundario }}
              >
                {meses[i]}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Box aria-hidden sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {LEGENDA.map((l) => (
          <Box
            key={l.texto}
            sx={{ display: "flex", alignItems: "center", gap: 1.5, fontFamily: tipografia.familiaMono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: paleta.textoSecundario }}
          >
            <Box sx={{ width: 10, height: 10, boxSizing: "border-box", bgcolor: l.cor, border: l.borda ? `1px solid ${l.borda}` : "none" }} />
            {l.texto}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
