"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import type { LinhaDeCategoria } from "@financas/core";
import { estiloMono, Valor } from "@financas/ui";
import { grafico, paleta, semantica } from "@financas/ui/tokens";

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Listras de "Sem categoria": cor nunca é o único sinal, o nome vem ao lado. */
export const LISTRAS = `repeating-linear-gradient(45deg, ${paleta.bordaControle} 0 2px, transparent 2px 5px)`;

/** Cor de cada categoria na barra e na tabela (as 3 maiores têm tom próprio; as demais dividem o último). */
export function corDaCategoria(indice: number): string {
  const tons = grafico.distribuicao;
  return tons[Math.min(indice, tons.length - 1)]!;
}

const colunas = { xs: "10px minmax(0, 1fr) 40px 52px 84px", md: "10px minmax(0, 1fr) 56px 64px 112px" };
const colunasSem = { xs: "10px minmax(0, 1fr) auto 84px", md: "10px minmax(0, 1fr) auto 112px" };

function Variacao({ variacao, mesAnterior }: { variacao: number | null; mesAnterior: string }) {
  const base = { ...estiloMono, fontSize: 11, textAlign: "right" } as const;
  if (variacao === null) {
    return (
      <Box component="span" aria-label={`Sem gasto em ${mesAnterior}`} sx={{ ...base, color: "text.secondary" }}>
        —
      </Box>
    );
  }
  const n = Math.round(variacao * 100);
  if (n === 0) {
    return (
      <Box component="span" aria-label={`Igual a ${mesAnterior}`} sx={{ ...base, color: "text.secondary" }}>
        =
      </Box>
    );
  }
  const subiu = n > 0;
  return (
    <Box
      component="span"
      aria-label={`${subiu ? "Aumentou" : "Diminuiu"} ${Math.abs(n)}% em relação a ${mesAnterior}`}
      sx={{ ...base, color: subiu ? semantica.atencao.texto : semantica.receita.texto }}
    >
      {subiu ? "+" : "−"}
      {Math.abs(n)}%
    </Box>
  );
}

export interface ListaCategoriasProps {
  linhas: LinhaDeCategoria[];
  nomes: Map<string, string>;
  /** Mês anterior por extenso, para as variações (ex.: "outubro"). */
  mesAnterior: string;
  onAbrir: (linha: LinhaDeCategoria) => void;
  /** Linha marcada (desktop: a que está no painel lateral). */
  selecionada?: string | null;
}

/** Barra empilhada + tabela: percentual, variação com sinal e valor. "Sem categoria" vem por último. */
export function ListaCategorias({ linhas, nomes, mesAnterior, onAbrir, selecionada }: ListaCategoriasProps) {
  const nome = (l: LinhaDeCategoria) => (l.categoriaId ? (nomes.get(l.categoriaId) ?? "Categoria") : "Sem categoria");
  const categorizadas = linhas.filter((l) => l.categoriaId !== null);
  const cor = (l: LinhaDeCategoria) => (l.categoriaId ? corDaCategoria(categorizadas.indexOf(l)) : LISTRAS);

  return (
    <>
      <Box
        role="img"
        aria-label={linhas.map((l) => `${l.categoriaId ? nome(l) : "sem categoria"} ${pct(l.participacao)}`).join(", ")}
        sx={{ display: "flex", gap: "2px", height: 14 }}
      >
        {linhas.map((l) => (
          <Box key={l.categoriaId ?? "sem"} sx={{ width: `${l.participacao * 100}%`, minWidth: 2, background: cor(l) }} />
        ))}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {linhas.map((l) => {
          const ativa = selecionada !== undefined && selecionada === l.categoriaId;
          return (
            <ButtonBase
              key={l.categoriaId ?? "sem"}
              onClick={() => onAbrir(l)}
              aria-current={ativa ? "true" : undefined}
              sx={{
                display: "grid",
                gridTemplateColumns: l.categoriaId ? colunas : colunasSem,
                alignItems: "center",
                gap: 2,
                minHeight: 52,
                borderTop: `1px solid ${paleta.divisor}`,
                mx: { xs: -4, md: -6 },
                px: { xs: 4, md: 6 },
                textAlign: "left",
                bgcolor: ativa ? paleta.elevado : "transparent",
                "&:hover": { bgcolor: paleta.elevado },
              }}
            >
              <Box aria-hidden sx={{ width: 10, height: 10, background: cor(l) }} />
              <Box component="span" sx={{ fontSize: 15, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: l.categoriaId ? "text.primary" : "text.secondary" }}>
                {nome(l)}
              </Box>
              {l.categoriaId ? (
                <>
                  <Box component="span" sx={{ ...estiloMono, fontSize: 12, color: "text.secondary", textAlign: "right" }}>
                    {pct(l.participacao)}
                  </Box>
                  <Variacao variacao={l.variacao} mesAnterior={mesAnterior} />
                </>
              ) : (
                <Box component="span" sx={{ ...estiloMono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Categorizar →
                </Box>
              )}
              <Valor valor={l.total} semSimbolo sx={{ fontSize: 14, textAlign: "right" }} />
            </ButtonBase>
          );
        })}
      </Box>
    </>
  );
}
