"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AddRounded from "@mui/icons-material/AddRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import IconButton from "@mui/material/IconButton";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { formatarDiaMes, hojeEmSaoPaulo, mesDe, nomeDoMes } from "@financas/core";
import { CardIndicador, CardSaldoProjetado, CarregandoLista, EstadoErro, EstadoVazio, SecaoCard, Valor } from "@financas/ui";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { BotaoOcultarValores } from "@/componentes/navegacao/BotaoOcultarValores";
import { useCartoes } from "@/hooks/useCartoes";
import { useCategorias, useFaturasResumo } from "@/hooks/useGastos";
import { useCaixinhas, useMovimentosCaixinhas } from "@/hooks/useCaixinhas";
import { useProjecao } from "@/hooks/useContas";
import { useCustoDeVida } from "@/hooks/useReserva";
import { useGastosDoMes } from "@/hooks/useGastosDoMes";
import { usePreferencias } from "@/stores/preferencias";
import { apresentarCaixinha, resumirPatrimonio } from "@/telas/caixinhas/resumo";
import { useComprasRecentes, useLancamentosDoMes, useOrcamentos, useSaidasDoMes } from "@/hooks/useInicio";
import { melhorDiaDeCompraGeral, resumirInicio } from "./resumo";
import {
  AgendaCartoes,
  Atalhos,
  CardEmBreve,
  DestaqueFatura,
  LinkSecao,
  OrcamentoDoMes,
  ParaOndeFoi,
  ResumoCaixinhas,
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
      <Box sx={{ display: { xs: "flex", md: "none" }, gap: 2 }}>
        <BotaoOcultarValores />
        <IconButton component={Link} href="/ajustes" aria-label="Ajustes" sx={{ bgcolor: "background.paper" }}>
          <SettingsRounded />
        </IconButton>
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
  const projecao = useProjecao();
  const caixinhas = useCaixinhas();
  const movCaixinhas = useMovimentosCaixinhas();
  const custo = useCustoDeVida();
  const baseGastos = usePreferencias((s) => s.baseGastos);
  const gastosMes = useGastosDoMes(mesDe(hoje), baseGastos);

  const r = useMemo(
    () => (cartoes.data && faturas.data ? resumirInicio(cartoes.data, faturas.data, hoje) : null),
    [cartoes.data, faturas.data, hoje],
  );
  const doMes = useLancamentosDoMes(r?.mesOrcamento);
  const orcamentos = useOrcamentos(r?.mesOrcamento);
  const saidasDoMes = useSaidasDoMes(r?.mesOrcamento);

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
            titulo="Vamos começar"
            descricao="Em 4 passos: cartão com a regra de fechamento, parcelamentos em andamento e o que já está na fatura."
            acao={
              <Button component={Link} href="/primeiros-passos/cartao" variant="contained" startIcon={<AddRounded />}>
                Começar
              </Button>
            }
          />
        </SecaoCard>
      </>
    );
  }

  const melhorDia = melhorDiaDeCompraGeral(r);
  const p = projecao.data;
  const semConta = (
    <CardEmBreve
      titulo="Quanto sobra no mês"
      texto="Cadastre sua conta para ver o saldo projetado até o fim do mês, depois das faturas e contas fixas."
      href="/contas"
      rotulo="Cadastrar conta"
    />
  );
  const sobraCelular = projecao.isPending ? (
    <Skeleton variant="rounded" height={120} sx={{ borderRadius: 5 }} />
  ) : p ? (
    <Box component={Link} href="/contas" aria-label={`Sobra em ${formatarDiaMes(p.ate)}: ver contas`} sx={{ textDecoration: "none", color: "inherit" }}>
      <CardSaldoProjetado
        compacto
        ate={p.ate}
        saldoFinal={p.saldoFinal}
        saldoHoje={p.saldoHoje}
        entradas={p.entradasPrevistas}
        faturas={p.faturasAVencer}
        contasFixas={p.contasFixas}
        acessorio={<ChevronRightRounded aria-hidden sx={{ color: "primary.main" }} />}
      />
    </Box>
  ) : (
    semConta
  );
  const sobraDesktop = p ? (
    <CardIndicador
      tom="contorno"
      titulo={`Sobra em ${formatarDiaMes(p.ate)}`}
      valor={p.saldoFinal}
      corValor={p.saldoFinal < 0 ? "#B91C1C" : undefined}
      detalhe={
        <>
          Saldo hoje <Valor valor={p.saldoHoje} sx={{ font: "inherit" }} />
        </>
      }
    />
  ) : projecao.isPending ? (
    <Skeleton variant="rounded" height={130} sx={{ borderRadius: 5 }} />
  ) : (
    semConta
  );

  return (
    <>
      <Cabecalho />
      <Stack spacing={4}>
        {/* Celular e tablet */}
        <Stack spacing={4} sx={{ display: { xs: "flex", md: "none" } }}>
          <DestaqueFatura r={r} melhorDia={melhorDia} />
          {sobraCelular}
          <Atalhos />
        </Stack>

        {/* Desktop: quatro indicadores */}
        <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 4 }}>
          {sobraDesktop}
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
              <OrcamentoDoMes
                mes={r.mesOrcamento}
                lancamentos={doMes.data}
                saidas={saidasDoMes.data ?? []}
                orcamentos={orcamentos.data}
                categorias={categorias.data}
              />
            )}
          </Box>
          <Box sx={{ flex: "1 1 380px", minWidth: 0 }}>
            {caixinhas.isPending || movCaixinhas.isPending ? (
              <Skeleton variant="rounded" height={180} sx={{ borderRadius: 5 }} />
            ) : caixinhas.data && caixinhas.data.length > 0 && movCaixinhas.data ? (
              <ResumoCaixinhas
                {...resumirPatrimonio(caixinhas.data, movCaixinhas.data, hoje)}
                caixinhas={caixinhas.data.filter((c) => !c.reservaMeses)}
                reserva={(() => {
                  const c = caixinhas.data.find((x) => x.reservaMeses);
                  if (!c) return undefined;
                  const a = apresentarCaixinha(c, custo.data, cartoes.data, faturas.data, hoje);
                  return { nome: c.nome, saldo: c.saldo, sugerida: a.meta, texto: a.dica ?? "" };
                })()}
              />
            ) : (
              <CardEmBreve
                titulo="Caixinhas"
                texto="Separe dinheiro por objetivo, como a reserva de emergência ou a próxima fatura."
                href="/caixinhas"
                rotulo="Criar caixinha"
              />
            )}
          </Box>
        </Box>

        {gastosMes.resumo && gastosMes.resumo.total > 0 && (
          <ParaOndeFoi
            mes={mesDe(hoje)}
            total={gastosMes.resumo.total}
            linhas={gastosMes.resumo.linhas}
            nomes={new Map((categorias.data ?? []).map((c) => [c.id, c.nome]))}
          />
        )}

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
