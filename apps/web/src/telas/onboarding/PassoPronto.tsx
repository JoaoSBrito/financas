"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Data } from "@financas/core";
import { estiloMono, estiloPainel, Rotulo, SecaoCard, Valor } from "@financas/ui";
import { paleta, semantica } from "@financas/ui/tokens";
import { useComprasDoInicio } from "@/hooks/useGastos";
import { faturasDeReferencia, type CartaoCompleto, type FaturaResumo } from "@/services/cartoes-mapeamento";
import { RodapePasso } from "./RodapePasso";

function ItemResumo({ feito, titulo, detalhe }: { feito: boolean; titulo: string; detalhe: ReactNode }) {
  return (
    <Box component="li" sx={{ display: "flex", alignItems: "center", gap: 3, minHeight: 60, borderTop: `1px solid ${paleta.divisor}`, "&:first-of-type": { borderTop: "none" } }}>
      {/* ✓ quando configurado; traço quando ficou para depois. O texto ao lado diz o mesmo. */}
      <Box
        component="span"
        aria-hidden
        sx={{ ...estiloMono, width: 24, height: 24, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, bgcolor: feito ? semantica.confirmado.fundo : "transparent", color: feito ? semantica.confirmado.texto : "text.secondary", border: feito ? "none" : `1px dashed ${paleta.bordaControle}` }}
      >
        {feito ? "✓" : "–"}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Box component="span" sx={{ fontSize: 15 }}>
          {titulo}
        </Box>
        <Rotulo>{detalhe}</Rotulo>
      </Box>
    </Box>
  );
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

export function PassoPronto({ cartoes, faturas, hoje }: { cartoes: CartaoCompleto[]; faturas: FaturaResumo[]; hoje: Data }) {
  const parcelamentos = useComprasDoInicio("anterior_ao_app").data ?? [];
  const saldos = useComprasDoInicio("saldo_inicial").data ?? [];
  const comprometido = parcelamentos.reduce((s, c) => s + c.restante, 0);
  const saldoInicial = saldos.reduce((s, c) => s + c.valorTotal, 0);

  // A mesma "fatura atual" do Início: a fatura aberta de cada cartão.
  const faturaAtual = cartoes.reduce((soma, c) => {
    const doCartao = faturas.filter((f) => f.cartaoId === c.id);
    const aberta = faturasDeReferencia(c, doCartao, hoje).aberta;
    return soma + (doCartao.find((f) => f.mes === aberta)?.total ?? 0);
  }, 0);

  return (
    <Stack spacing={4}>
      <Box component="ul" aria-label="Resumo" sx={{ ...estiloPainel, listStyle: "none", m: 0, px: 4, py: 1 }}>
        <ItemResumo feito={cartoes.length > 0} titulo={plural(cartoes.length, "cartão", "cartões")} detalhe={cartoes.map((c) => c.nome).join(" · ")} />
        <ItemResumo
          feito={parcelamentos.length > 0}
          titulo={parcelamentos.length ? `${plural(parcelamentos.length, "parcelamento", "parcelamentos")} em andamento` : "Nenhum parcelamento em andamento"}
          detalhe={
            parcelamentos.length ? (
              <>
                <Valor valor={comprometido} semSimbolo sx={{ font: "inherit" }} /> comprometidos
              </>
            ) : (
              "Dá para lançar depois"
            )
          }
        />
        <ItemResumo
          feito={saldos.length > 0}
          titulo="Saldo inicial das faturas"
          detalhe={saldos.length ? <Valor valor={saldoInicial} semSimbolo sx={{ font: "inherit" }} /> : "Sem saldo inicial"}
        />
      </Box>

      <Box component="section" aria-label="Prévia do painel" sx={{ ...estiloPainel, p: 4, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Rotulo>Fatura atual · {plural(cartoes.length, "cartão", "cartões")}</Rotulo>
        <Valor valor={faturaAtual} sx={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1 }} />
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          É isso que você vai ver no Início.
        </Typography>
      </Box>

      <SecaoCard titulo="Instale na tela inicial" gap={2}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Assim o app abre em tela cheia, como um aplicativo. No iPhone, use Compartilhar → “Adicionar à Tela de Início” no Safari. No Android, use o
          menu ⋮ → “Instalar app” no Chrome.
        </Typography>
      </SecaoCard>

      <RodapePasso>
        <Button component={Link} href="/" variant="contained" size="large">
          Começar a usar
        </Button>
      </RodapePasso>
    </Stack>
  );
}
