"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AddRounded from "@mui/icons-material/AddRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";
import { useMemo } from "react";
import { formatarDiaMes, hojeEmSaoPaulo, mesDe, nomeDoMes } from "@financas/core";
import { CarregandoLista, EstadoErro, EstadoVazio, LogoLastro, Rotulo, SecaoCard } from "@financas/ui";
import { BotaoOcultarValores } from "@/componentes/navegacao/BotaoOcultarValores";
import { corDoCartao, paleta } from "@financas/ui/tokens";
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
  Atalhos,
  CardEmBreve,
  CelulaSobra,
  OrcamentoDoMes,
  PainelDoMes,
  ParaOndeFoi,
  ProximasDatas,
  ProximasFaturas,
  ResumoCaixinhas,
  UltimosGastos,
} from "./Secoes";

const somenteLeitor = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" } as const;

function Cabecalho() {
  const hoje = hojeEmSaoPaulo();
  const mes = nomeDoMes(mesDe(hoje));
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: { xs: 3, md: 4 } }}>
      {/* Celular: logotipo e mês; desktop: título da página (o logotipo está na barra superior). */}
      <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 2.5 }}>
        <LogoLastro tamanho={22} />
        <Rotulo sx={{ border: `1px solid ${paleta.divisor}`, borderRadius: "4px", px: 1.5, py: 0.5 }}>{mes}</Rotulo>
      </Box>
      <Typography variant="h1" sx={{ display: { xs: "none", md: "block" } }}>
        Início
      </Typography>
      <Typography component="span" sx={somenteLeitor}>
        Início · {mes}
      </Typography>
      <Rotulo sx={{ display: { xs: "none", md: "inline" } }}>Hoje · {formatarDiaMes(hoje)}</Rotulo>
      <Box sx={{ display: { xs: "flex", sm: "none" }, gap: 1.5 }}>
        <BotaoOcultarValores />
        <IconButton component={Link} href="/ajustes" aria-label="Ajustes" sx={{ border: `1px solid ${paleta.divisor}`, color: "text.secondary" }}>
          <SettingsRounded fontSize="small" />
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
          <Skeleton variant="rounded" height={200} />
          <Skeleton variant="rounded" height={260} />
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
  const sobra = projecao.isPending ? (
    <Skeleton variant="rounded" height={56} />
  ) : p ? (
    <CelulaSobra ate={p.ate} valor={p.saldoFinal} />
  ) : (
    <>
      <Rotulo>Quanto sobra no mês</Rotulo>
      <Box component={Link} href="/contas" sx={{ fontSize: 14, color: "text.primary", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
        Cadastrar conta →
      </Box>
    </>
  );
  const corPorCartao = new Map(cartoes.data.map((c, i) => [c.nome, corDoCartao(i)]));

  return (
    <>
      <Cabecalho />
      <Stack spacing={3}>
        <PainelDoMes r={r} melhorDia={melhorDia} sobra={sobra} />
        <Box sx={{ display: { xs: "block", sm: "none" } }}>
          <Atalhos />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, gap: 3, alignItems: "start" }}>
          <Box sx={{ order: { xs: 2, md: 1 }, minWidth: 0 }}>
            <ProximasFaturas meses={r.proximasFaturas} />
          </Box>
          <Box sx={{ order: { xs: 1, md: 2 }, minWidth: 0 }}>
            <ProximasDatas r={r} corPorCartao={corPorCartao} />
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }, gap: 3, alignItems: "start" }}>
          <Box sx={{ minWidth: 0 }}>
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
          <Box sx={{ minWidth: 0, order: { md: 3 } }}>
            {caixinhas.isPending || movCaixinhas.isPending ? (
              <Skeleton variant="rounded" height={180} />
            ) : caixinhas.data && caixinhas.data.length > 0 && movCaixinhas.data ? (
              <ResumoCaixinhas
                {...resumirPatrimonio(caixinhas.data, movCaixinhas.data, hoje)}
                caixinhas={caixinhas.data.filter((c) => !c.reservaMeses)}
                reserva={(() => {
                  const c = caixinhas.data.find((x) => x.reservaMeses);
                  if (!c) return undefined;
                  const a = apresentarCaixinha(c, custo.data, cartoes.data, faturas.data, hoje);
                  const custoMensal = custo.data?.valor ?? 0;
                  return {
                    nome: c.nome,
                    saldo: c.saldo,
                    sugerida: a.meta,
                    texto: a.dica ?? "",
                    coberto: custoMensal > 0 ? c.saldo / custoMensal : null,
                    meses: c.reservaMeses ?? 6,
                  };
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
          <Box sx={{ minWidth: 0, order: { md: 2 } }}>
            {gastosMes.resumo && gastosMes.resumo.total > 0 && (
              <ParaOndeFoi
                mes={mesDe(hoje)}
                total={gastosMes.resumo.total}
                linhas={gastosMes.resumo.linhas}
                nomes={new Map((categorias.data ?? []).map((c) => [c.id, c.nome]))}
              />
            )}
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
