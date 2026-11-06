"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { LinhaDeCategoria } from "@financas/core";
import { Valor } from "@financas/ui";
import { cores } from "@financas/ui/tokens";

const pct = (n: number) => `${Math.round(n * 100)}%`;

function Variacao({ variacao }: { variacao: number | null }) {
  if (variacao === null) return null;
  const subiu = variacao > 0;
  const texto = `${subiu ? "+" : "−"}${Math.abs(Math.round(variacao * 100))}%`;
  return (
    <Typography
      component="span"
      aria-label={`${subiu ? "Aumentou" : "Diminuiu"} ${Math.abs(Math.round(variacao * 100))}% em relação ao mês anterior`}
      sx={{ fontSize: 11, fontWeight: 700, color: subiu ? cores.alerta : cores.investimento }}
    >
      {texto}
    </Typography>
  );
}

/** Barras por categoria; "Sem categoria" vem por último. */
export function ListaCategorias({
  linhas,
  nomes,
  onAbrir,
  limite,
}: {
  linhas: LinhaDeCategoria[];
  nomes: Map<string, string>;
  onAbrir?: (linha: LinhaDeCategoria) => void;
  limite?: number;
}) {
  const exibidas = limite ? linhas.filter((l) => l.categoriaId !== null).slice(0, limite) : linhas;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {exibidas.map((l) => {
        const nome = l.categoriaId ? (nomes.get(l.categoriaId) ?? "Categoria") : "Sem categoria";
        const conteudo = (
          <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1.5, py: 2.5, textAlign: "left" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2 }}>
              <Typography variant="subtitle1" sx={{ color: l.categoriaId ? undefined : "text.secondary" }}>
                {nome}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                {!limite && <Variacao variacao={l.variacao} />}
                <Valor valor={l.total} sx={{ fontSize: 14, fontWeight: 700 }} />
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ flex: 1, height: 8, borderRadius: 1, bgcolor: cores.borda, overflow: "hidden" }} aria-hidden>
                <Box sx={{ width: pct(l.participacao), height: "100%", bgcolor: l.categoriaId ? cores.primaria : cores.textoSuave }} />
              </Box>
              <Typography variant="caption" sx={{ minWidth: 36, textAlign: "right" }}>
                {pct(l.participacao)}
              </Typography>
            </Box>
            {!l.categoriaId && onAbrir && <Typography variant="caption">Toque para categorizar</Typography>}
          </Box>
        );
        return onAbrir ? (
          <ButtonBase key={l.categoriaId ?? "sem"} onClick={() => onAbrir(l)} sx={{ borderRadius: 2, px: 1, mx: -1 }}>
            {conteudo}
          </ButtonBase>
        ) : (
          <Box key={l.categoriaId ?? "sem"}>{conteudo}</Box>
        );
      })}
    </Box>
  );
}
