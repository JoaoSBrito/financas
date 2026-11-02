"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AddRounded from "@mui/icons-material/AddRounded";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { formatarDiaMes, hojeEmSaoPaulo, mesDe, nomeDoMes } from "@financas/core";
import { CardIndicador, CarregandoLista, EstadoErro, EstadoVazio, SecaoCard, Valor } from "@financas/ui";
import { BotaoOcultarValores } from "@/componentes/navegacao/BotaoOcultarValores";
import { useCartoes } from "@/hooks/useCartoes";
import { useCategorias, useFaturasResumo } from "@/hooks/useGastos";
import { useComprasRecentes, useLancamentosDoMes, useOrcamentos } from "@/hooks/useInicio";
import { melhorDiaDeCompraGeral, resumirInicio } from "./resumo";
import {
  AgendaCartoes,
  Atalhos,
  CardEmBreve,
  DestaqueFatura,
  LinkSecao,
  OrcamentoDoMes,
  UltimosGastos,
} from "./Secoes";

// O gráfico só roda no navegador e não precisa pesar o primeiro carregamento.
const GraficoFaturas = dynamic(() => import("@/componentes/graficos/GraficoFaturas"), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={200} />,
});

function saudacao(): string {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hourCycle: "h23" }).format(new Date()),
  );
  return hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
}

function Cabecalho() {
  const mes = nomeDoMes(mesDe(hojeEmSaoPaulo()));
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
          {saudacao()}
        </Typography>
        <Typography variant="h1">{mes.charAt(0).toUpperCase() + mes.slice(1)}</Typography>
      </Box>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <BotaoOcultarValores />
      </Box>
    </Box>
  );
}

export function TelaInicio() {
  const hoje = hojeEmSaoPaulo();
  const cartoes = useCartoes();
  const faturas = useFaturasResumo();
  const categorias = useCategorias();
  const recentes = useComprasRecentes();

  const r = useMemo(
    () => (cartoes.data && faturas.data ? resumirInicio(cartoes.data, faturas.data, hoje) : null),
    [cartoes.data, faturas.data, hoje],
  );
  const doMes = useLancamentosDoMes(r?.mesOrcamento);
  const orcamentos = useOrcamentos(r?.mesOrcamento);

  if (cartoes.isPending || faturas.isPending) {
    return (
      <>
        <Cabecalho />
        <Stack spacing={4} aria-busy="true" aria-label="Carregando">
          <Skeleton variant="rounded" height={200} sx={{ borderRadius: 6 }} />
          <Skeleton variant="rounded" height={260} sx={{ borderRadius: 5 }} />
        </Stack>
      </>
    );
  }
  if (cartoes.isError || faturas.isError || !r) {
    return (
      <>
        <Cabecalho />
        <EstadoErro
          mensagem="Não foi possível carregar o resumo."
          onTentarNovamente={() => {
            void cartoes.refetch();
            void faturas.refetch();
          }}
        />
      </>
    );
  }
  if (cartoes.data.length === 0) {
    return (
      <>
        <Cabecalho />
        <SecaoCard>
          <EstadoVazio
            titulo="Vamos começar pelo seu cartão"
            descricao="Cadastre o cartão com a regra de fechamento. Depois, é só lançar os gastos."
            acao={
              <Button component={Link} href="/cartoes/novo" variant="contained" startIcon={<AddRounded />}>
                Cadastrar cartão
              </Button>
            }
          />
        </SecaoCard>
      </>
    );
  }

  const melhorDia = melhorDiaDeCompraGeral(r);
  const sobra = (
    <CardEmBreve
      titulo="Quanto sobra no mês"
      texto="Com suas contas cadastradas, este card mostra o saldo projetado até o fim do mês."
      href="/contas"
      rotulo="Ir para Contas"
    />
  );

  return (
    <>
      <Cabecalho />
      <Stack spacing={4}>
        {/* Celular e tablet */}
        <Stack spacing={4} sx={{ display: { xs: "flex", md: "none" } }}>
          <DestaqueFatura r={r} melhorDia={melhorDia} />
          {sobra}
          <Atalhos />
        </Stack>

        {/* Desktop: quatro indicadores */}
        <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 4 }}>
          {sobra}
          <CardIndicador
            tom="destaque"
            titulo="Fatura atual · todos"
            valor={r.faturaAtual}
            detalhe={r.proximoFechamento ? `${r.proximoFechamento.cartao} fecha em ${formatarDiaMes(r.proximoFechamento.data)}` : undefined}
          />
          <CardIndicador titulo="Limite disponível" valor={r.limiteDisponivel} detalhe={<>de <Valor valor={r.limiteTotal} sx={{ font: "inherit" }} /></>} />
          <CardIndicador
            titulo="Comprometido em parcelas"
            valor={r.comprometidoFuturo}
            detalhe={r.ultimoMesComprometido ? `até ${nomeDoMes(r.ultimoMesComprometido)}` : "nenhuma parcela futura"}
          />
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          <Box sx={{ flex: "2 1 420px", minWidth: 0 }}>
            <SecaoCard titulo="Próximas faturas" acao={<LinkSecao href="/cartoes">Ver tudo</LinkSecao>}>
              <GraficoFaturas meses={r.proximasFaturas} />
              <Typography variant="caption" component="p">
                Meses seguintes mostram parcelas já lançadas.
              </Typography>
            </SecaoCard>
          </Box>
          <Box sx={{ flex: "1 1 300px", minWidth: 0, display: { xs: "none", md: "block" } }}>
            <AgendaCartoes r={r} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "flex-start" }}>
          <Box sx={{ flex: "1 1 380px", minWidth: 0 }}>
            {doMes.isPending || orcamentos.isPending || categorias.isPending ? (
              <SecaoCard titulo="Orçamento">
                <CarregandoLista linhas={3} />
              </SecaoCard>
            ) : doMes.isError || orcamentos.isError || categorias.isError ? (
              <SecaoCard titulo="Orçamento">
                <EstadoErro mensagem="Não foi possível carregar o orçamento." onTentarNovamente={() => void doMes.refetch()} />
              </SecaoCard>
            ) : (
              <OrcamentoDoMes mes={r.mesOrcamento} lancamentos={doMes.data} orcamentos={orcamentos.data} categorias={categorias.data} />
            )}
          </Box>
          <Box sx={{ flex: "1 1 380px", minWidth: 0 }}>
            <CardEmBreve
              titulo="Caixinhas"
              texto="Suas caixinhas e metas aparecem aqui quando a tela de investimentos estiver pronta."
              href="/caixinhas"
              rotulo="Ir para Caixinhas"
            />
          </Box>
        </Box>

        {recentes.isPending ? (
          <SecaoCard titulo="Últimos gastos">
            <CarregandoLista linhas={3} />
          </SecaoCard>
        ) : recentes.isError ? (
          <SecaoCard titulo="Últimos gastos">
            <EstadoErro mensagem="Não foi possível carregar os últimos gastos." onTentarNovamente={() => void recentes.refetch()} />
          </SecaoCard>
        ) : (
          <UltimosGastos compras={recentes.data} cartoes={cartoes.data} categorias={categorias.data ?? []} />
        )}
      </Stack>
    </>
  );
}
