"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import { useState } from "react";
import { evolucaoMensal, hojeEmSaoPaulo } from "@financas/core";
import { CardCaixinha, EstadoErro, EstadoVazio, IconeCaixinha, ReguaCobertura, Rotulo, SecaoCard, Valor } from "@financas/ui";
import { grafico, paleta, semantica, tipografia } from "@financas/ui/tokens";
import { useCaixinhas, useMovimentosCaixinhas } from "@/hooks/useCaixinhas";
import { useCartoes } from "@/hooks/useCartoes";
import { useContas } from "@/hooks/useContas";
import { useFaturasResumo } from "@/hooks/useGastos";
import { useCustoDeVida } from "@/hooks/useReserva";
import type { Caixinha } from "@/services/caixinhas";
import { DialogoAcoes, DialogoAtualizarSaldo, DialogoCaixinha, DialogoMovimentar } from "./Dialogos";
import { apresentarCaixinha, resumirPatrimonio } from "./resumo";

const GraficoEvolucao = dynamic(() => import("@/componentes/graficos/GraficoEvolucao"), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={200} />,
});

const CORES_DISTRIBUICAO = grafico.distribuicao;

type Dialogo =
  | { tipo: "nova" }
  | { tipo: "editar"; caixinha: Caixinha }
  | { tipo: "acoes"; caixinha: Caixinha }
  | { tipo: "movimentar"; mov: "deposito" | "resgate"; caixinhaId?: string }
  | { tipo: "atualizar"; caixinha: Caixinha }
  | null;

export function TelaCaixinhas() {
  const hoje = hojeEmSaoPaulo();
  const caixinhas = useCaixinhas();
  const movimentos = useMovimentosCaixinhas();
  const cartoes = useCartoes();
  const faturas = useFaturasResumo();
  const contas = useContas();
  const custo = useCustoDeVida();
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const fechar = () => setDialogo(null);

  const reservaAtual = caixinhas.data?.find((c) => c.reservaMeses);
  const carregando = caixinhas.isPending || movimentos.isPending || cartoes.isPending || faturas.isPending;
  const erro = caixinhas.isError || movimentos.isError || cartoes.isError || faturas.isError;

  let corpo: React.ReactNode;
  if (carregando) {
    corpo = (
      <Stack spacing={4} aria-busy="true" aria-label="Carregando">
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={260} />
      </Stack>
    );
  } else if (erro) {
    corpo = (
      <EstadoErro
        mensagem="Não foi possível carregar as caixinhas."
        onTentarNovamente={() => {
          void caixinhas.refetch();
          void movimentos.refetch();
        }}
      />
    );
  } else if (caixinhas.data.length === 0) {
    corpo = (
      <SecaoCard>
        <EstadoVazio
          titulo="Crie sua primeira caixinha"
          descricao="Reserva de emergência, viagem ou o dinheiro da próxima fatura: separe por objetivo e acompanhe as metas."
          acao={
            <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDialogo({ tipo: "nova" })}>
              Criar caixinha
            </Button>
          }
        />
      </SecaoCard>
    );
  } else {
    // A reserva de emergência aparece primeiro.
    const lista = [...caixinhas.data].sort((a, b) => Number(Boolean(b.reservaMeses)) - Number(Boolean(a.reservaMeses)));
    const r = resumirPatrimonio(lista, movimentos.data, hoje);
    const evolucao = evolucaoMensal(movimentos.data, hoje, 6);
    const comSaldo = lista.filter((c) => c.saldo > 0).sort((a, b) => b.saldo - a.saldo);

    const reserva = lista.find((c) => c.reservaMeses);
    const custoMensal = custo.data?.valor ?? 0;
    const divisor = `1px solid ${paleta.divisor}`;
    const celula = { p: { xs: "12px 16px", md: "14px 24px" }, display: "flex", flexDirection: "column", gap: 0.75, minWidth: 0 } as const;

    corpo = (
      <Stack spacing={3}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1.6fr)" }, gap: 3, alignItems: "stretch" }}>
          {/* Nível da página: o patrimônio de todos os tipos de investimento (hoje, só caixinhas). */}
          <Card component="section" aria-label="Patrimônio investido" sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <Box sx={{ ...celula, gridColumn: "1 / -1", gap: 1.5, borderBottom: divisor, p: { xs: "16px", md: "20px 24px" } }}>
              <Rotulo>Patrimônio investido</Rotulo>
              <Valor valor={r.total} component="p" sx={{ m: 0, fontSize: { xs: 36, md: 34 }, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.03em" }} />
            </Box>
            <Box sx={{ ...celula, borderRight: divisor }}>
              <Rotulo>Rendeu no mês</Rotulo>
              <Valor valor={r.rendeuNoMes} sinal="sempre" sx={{ fontSize: 14, color: semantica.receita.texto }} />
            </Box>
            <Box sx={{ ...celula, borderRight: divisor }}>
              <Rotulo>Rendeu no ano</Rotulo>
              <Valor valor={r.rendeuNoAno} sinal="sempre" sx={{ fontSize: 14, color: semantica.receita.texto }} />
            </Box>
            <Box sx={celula}>
              <Rotulo>Guardado no mês</Rotulo>
              <Valor valor={r.guardadoNoMes} sinal="sempre" sx={{ fontSize: 14 }} />
            </Box>
            <Box sx={{ ...celula, gridColumn: "1 / -1", borderTop: divisor, gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Rotulo>Onde está investido</Rotulo>
                <Rotulo>1 tipo</Rotulo>
              </Box>
              <Box role="img" aria-label="Caixinhas: 100% do patrimônio" sx={{ height: 8, bgcolor: paleta.texto }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <IconeCaixinha sx={{ fontSize: 18 }} />
                  Caixinhas
                </Box>
                <Box component="span" sx={{ fontFamily: tipografia.familiaMono }}>100%</Box>
              </Box>
            </Box>
          </Card>
          <SecaoCard titulo="Evolução" acao={<Rotulo>Últimos 6 meses</Rotulo>}>
            <GraficoEvolucao pontos={evolucao} />
          </SecaoCard>
        </Box>

        {/* Módulo Caixinhas: cada tipo de investimento futuro vira um módulo igual a este. */}
        <Card component="section" aria-labelledby="titulo-modulo-caixinhas" sx={{ display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3.5, p: { xs: "16px", md: "20px 24px" }, borderBottom: divisor }}>
            <Box aria-hidden sx={{ flex: "0 0 48px", width: 48, height: 48, borderRadius: "12px", bgcolor: semantica.receita.fundo, color: paleta.acao, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconeCaixinha sx={{ fontSize: 28 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography id="titulo-modulo-caixinhas" variant="h2" sx={{ fontSize: 18 }}>
                Caixinhas
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Dinheiro separado por objetivo
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Valor valor={r.total} component="div" sx={{ fontSize: 17, fontWeight: 500 }} />
              <Rotulo>
                {lista.length} {lista.length === 1 ? "caixinha" : "caixinhas"}
              </Rotulo>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr) auto", gap: 2, p: { xs: "12px 16px", md: "14px 24px" }, borderBottom: divisor, maxWidth: { md: 560 } }}>
            <Button variant="contained" onClick={() => setDialogo({ tipo: "movimentar", mov: "deposito" })}>
              Guardar
            </Button>
            <Button variant="outlined" onClick={() => setDialogo({ tipo: "movimentar", mov: "resgate" })}>
              Resgatar
            </Button>
            <Button variant="outlined" aria-label="Nova caixinha" startIcon={<AddRounded />} onClick={() => setDialogo({ tipo: "nova" })} sx={{ borderStyle: "dashed" }}>
              Nova
            </Button>
          </Box>
          {reserva && custoMensal > 0 && (
            <Box sx={{ p: { xs: "14px 16px", md: "16px 24px" }, borderBottom: divisor, display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Rotulo>Reserva de emergência · {reserva.nome}</Rotulo>
                <Rotulo>
                  Custo <Valor valor={custoMensal} sx={{ font: "inherit" }} />
                  /mês
                </Rotulo>
              </Box>
              <ReguaCobertura
                coberto={reserva.saldo / custoMensal}
                meses={reserva.reservaMeses ?? 6}
                rotulo={`Reserva cobre ${(Math.floor((reserva.saldo / custoMensal) * 10) / 10).toLocaleString("pt-BR")} de ${reserva.reservaMeses} meses`}
              />
            </Box>
          )}
          <Box sx={{ p: { xs: "16px", md: "20px 24px" }, display: "flex", flexDirection: "column", gap: 4 }}>
            <Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 3 }}>
                {lista.map((c) => {
                  const a = apresentarCaixinha(c, custo.data, cartoes.data, faturas.data, hoje);
                  return (
                    <CardCaixinha
                      key={c.id}
                      nome={c.nome}
                      selo={a.selo}
                      detalhe={a.detalhe}
                      saldo={c.saldo}
                      meta={a.meta}
                      dataMeta={a.dataMeta}
                      dica={a.dica}
                      onAbrir={() => setDialogo({ tipo: "acoes", caixinha: c })}
                    />
                  );
                })}
              </Box>
            </Box>
            {comSaldo.length > 0 && (
              <Box sx={{ borderTop: divisor, pt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                <Rotulo>Distribuição entre as caixinhas</Rotulo>
                <Box role="img" aria-label={comSaldo.map((c) => `${c.nome}: ${Math.round((c.saldo / r.total) * 100)}%`).join(", ")} sx={{ height: 10, display: "flex", gap: "2px" }}>
                  {comSaldo.map((c, i) => (
                    <Box key={c.id} sx={{ width: `${(c.saldo / r.total) * 100}%`, bgcolor: CORES_DISTRIBUICAO[i % CORES_DISTRIBUICAO.length] }} />
                  ))}
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "10px minmax(0, 1fr) auto", gap: "6px 10px", alignItems: "center", fontSize: 13 }}>
                  {comSaldo.map((c, i) => (
                    <Box key={c.id} sx={{ display: "contents" }}>
                      <Box aria-hidden sx={{ width: 8, height: 8, bgcolor: CORES_DISTRIBUICAO[i % CORES_DISTRIBUICAO.length] }} />
                      <span>{c.nome}</span>
                      <Box component="span" sx={{ fontFamily: tipografia.familiaMono, color: "text.secondary" }}>
                        {Math.round((c.saldo / r.total) * 100)}%
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Card>
      </Stack>
    );
  }

  return (
    <>
      <Typography variant="h1" sx={{ mb: { xs: 3, md: 4 } }}>
        Investimentos
      </Typography>
      {corpo}

      {dialogo?.tipo === "nova" && <DialogoCaixinha cartoes={cartoes.data ?? []} reservaAtual={reservaAtual} onFechar={fechar} />}
      {dialogo?.tipo === "editar" && (
        <DialogoCaixinha caixinha={dialogo.caixinha} cartoes={cartoes.data ?? []} reservaAtual={reservaAtual} onFechar={fechar} />
      )}
      {dialogo?.tipo === "atualizar" && <DialogoAtualizarSaldo caixinha={dialogo.caixinha} onFechar={fechar} />}
      {dialogo?.tipo === "movimentar" && (
        <DialogoMovimentar
          caixinhas={caixinhas.data ?? []}
          contas={contas.data ?? []}
          inicial={{ tipo: dialogo.mov, caixinhaId: dialogo.caixinhaId }}
          onFechar={fechar}
        />
      )}
      {dialogo?.tipo === "acoes" && (
        <DialogoAcoes
          caixinha={dialogo.caixinha}
          onFechar={fechar}
          onEscolher={(acao) => {
            const c = dialogo.caixinha;
            if (acao === "editar") setDialogo({ tipo: "editar", caixinha: c });
            else if (acao === "atualizar") setDialogo({ tipo: "atualizar", caixinha: c });
            else setDialogo({ tipo: "movimentar", mov: acao, caixinhaId: c.id });
          }}
        />
      )}
    </>
  );
}
