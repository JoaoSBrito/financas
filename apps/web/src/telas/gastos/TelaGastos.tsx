"use client";

import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { hojeEmSaoPaulo, mesDe, nomeDoMes, somarMeses, type LinhaDeCategoria } from "@financas/core";
import { CardIndicador, EstadoErro, EstadoVazio, PilulasSelecao, SecaoCard, Valor } from "@financas/ui";
import { useCartoes } from "@/hooks/useCartoes";
import { useContas } from "@/hooks/useContas";
import { useCategorias } from "@/hooks/useGastos";
import { useGastosDoMes } from "@/hooks/useGastosDoMes";
import { usePreferencias } from "@/stores/preferencias";
import { DialogoDetalheCategoria } from "./DialogoDetalheCategoria";
import { ListaCategorias } from "./ListaCategorias";

const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function TelaGastos() {
  const [mes, setMes] = useState(mesDe(hojeEmSaoPaulo()));
  const { baseGastos, definirBaseGastos } = usePreferencias();
  const gastos = useGastosDoMes(mes, baseGastos);
  const categorias = useCategorias();
  const cartoes = useCartoes();
  const contas = useContas();
  const [aberta, setAberta] = useState<LinhaDeCategoria | null>(null);
  const nomes = new Map((categorias.data ?? []).map((c) => [c.id, c.nome]));
  const nomeMes = nomeDoMes(mes, false);

  const variacaoTotal =
    gastos.resumo && gastos.resumo.totalAnterior > 0 ? (gastos.resumo.total - gastos.resumo.totalAnterior) / gastos.resumo.totalAnterior : null;

  return (
    <>
      <Typography variant="h1" sx={{ mb: 4 }}>
        Gastos
      </Typography>

      <Stack spacing={3} sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton aria-label="Mês anterior" onClick={() => setMes(somarMeses(mes, -1))}>
            <ChevronLeftRounded />
          </IconButton>
          <Typography aria-live="polite" sx={{ fontWeight: 800, fontSize: 18, minWidth: 180, textAlign: "center" }}>
            {maiuscula(nomeDoMes(mes))}
          </Typography>
          <IconButton aria-label="Próximo mês" onClick={() => setMes(somarMeses(mes, 1))}>
            <ChevronRightRounded />
          </IconButton>
        </Box>
        <PilulasSelecao
          rotulo="Gastos do cartão com base na"
          tamanho="pequeno"
          valor={baseGastos}
          onChange={definirBaseGastos}
          opcoes={[
            { valor: "compra", rotulo: "Data da compra" },
            { valor: "fatura", rotulo: "Data da fatura" },
          ]}
        />
      </Stack>

      {gastos.isPending || categorias.isPending ? (
        <Stack spacing={4} aria-busy="true" aria-label="Carregando">
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 5 }} />
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: 5 }} />
        </Stack>
      ) : gastos.isError || !gastos.resumo ? (
        <EstadoErro mensagem="Não foi possível carregar os gastos." onTentarNovamente={gastos.refetch} />
      ) : gastos.resumo.total === 0 ? (
        <SecaoCard>
          <EstadoVazio titulo={`Nenhum gasto em ${nomeMes}`} descricao="Gastos no cartão e saídas da conta aparecem aqui, separados por categoria." />
        </SecaoCard>
      ) : (
        <Stack spacing={4}>
          <CardIndicador
            tom="destaque"
            titulo={`Gasto em ${nomeMes}`}
            valor={gastos.resumo.total}
            detalhe={
              gastos.resumo.totalAnterior > 0 ? (
                <>
                  Mês anterior: <Valor valor={gastos.resumo.totalAnterior} sx={{ font: "inherit" }} />
                  {variacaoTotal !== null && ` (${variacaoTotal > 0 ? "+" : "−"}${Math.abs(Math.round(variacaoTotal * 100))}%)`}
                </>
              ) : undefined
            }
          />
          <SecaoCard titulo="Por categoria" gap={1}>
            <ListaCategorias linhas={gastos.resumo.linhas} nomes={nomes} onAbrir={setAberta} />
            <Typography variant="caption" component="p" sx={{ pt: 2 }}>
              {baseGastos === "compra"
                ? "Pela data da compra: cada parcela conta a partir do mês em que você comprou. "
                : "Pela data da fatura: cada parcela conta no mês da fatura em que cai. "}
              Transferências, pagamento de fatura e saldo inicial ficam de fora. O orçamento, em Categorias, segue a fatura.
            </Typography>
          </SecaoCard>
        </Stack>
      )}

      {aberta && (
        <DialogoDetalheCategoria
          titulo={`${aberta.categoriaId ? (nomes.get(aberta.categoriaId) ?? "Categoria") : "Sem categoria"} · ${nomeMes}`}
          itens={gastos.itensDoMes.filter((i) => i.categoriaId === aberta.categoriaId)}
          cartoes={cartoes.data ?? []}
          contas={contas.data ?? []}
          categorias={categorias.data ?? []}
          onFechar={() => setAberta(null)}
        />
      )}
    </>
  );
}
