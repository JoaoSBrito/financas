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
import { CardCaixinha, EstadoErro, EstadoVazio, SecaoCard, Valor } from "@financas/ui";
import { grafico, paleta, semantica } from "@financas/ui/tokens";
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

    corpo = (
      <Stack spacing={4}>
        <Card component="section" aria-label="Patrimônio guardado" sx={{ p: { xs: "20px", md: "32px" }, display: "flex", flexDirection: "column", gap: 4 }}>
          <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
            Patrimônio guardado
          </Typography>
          <Valor valor={r.total} component="p" sx={{ m: 0, fontSize: 40, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.02em" }} />
          <Box sx={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="caption">
                Rendeu no mês
              </Typography>
              <Valor valor={r.rendeuNoMes} sinal="sempre" component="div" sx={{ fontSize: 14, color: semantica.receita.texto }} />
            </Box>
            <Box>
              <Typography variant="caption">
                Rendeu no ano
              </Typography>
              <Valor valor={r.rendeuNoAno} sinal="sempre" component="div" sx={{ fontSize: 14, color: semantica.receita.texto }} />
            </Box>
            <Box>
              <Typography variant="caption">
                Guardado no mês
              </Typography>
              <Valor valor={r.guardadoNoMes} sinal="sempre" component="div" sx={{ fontSize: 14 }} />
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 2.5, maxWidth: { md: 420 } }}>
            <Button variant="contained" onClick={() => setDialogo({ tipo: "movimentar", mov: "deposito" })}>
              Guardar
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setDialogo({ tipo: "movimentar", mov: "resgate" })}>
              Resgatar
            </Button>
          </Box>
        </Card>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          <Box sx={{ flex: "2 1 420px", minWidth: 0 }}>
            <SecaoCard titulo="Evolução" acao={<Typography variant="caption">últimos 6 meses</Typography>}>
              <GraficoEvolucao pontos={evolucao} />
            </SecaoCard>
          </Box>
          <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
            <SecaoCard titulo="Onde está guardado">
              {comSaldo.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Nenhuma caixinha com saldo ainda.
                </Typography>
              ) : (
                <>
                  <Box role="img" aria-label={comSaldo.map((c) => `${c.nome}: ${Math.round((c.saldo / r.total) * 100)}%`).join(", ")} sx={{ height: 8, borderRadius: "4px", overflow: "hidden", display: "flex", gap: "2px" }}>
                    {comSaldo.map((c, i) => (
                      <Box key={c.id} sx={{ width: `${(c.saldo / r.total) * 100}%`, bgcolor: CORES_DISTRIBUICAO[i % CORES_DISTRIBUICAO.length] }} />
                    ))}
                  </Box>
                  <Stack spacing={2}>
                    {comSaldo.map((c, i) => (
                      <Box key={c.id} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: "5px", bgcolor: CORES_DISTRIBUICAO[i % CORES_DISTRIBUICAO.length] }} />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {c.nome}
                        </Typography>
                        <Typography variant="body2">
                          {Math.round((c.saldo / r.total) * 100)}%
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </SecaoCard>
          </Box>
        </Box>

        <Box component="section" aria-labelledby="titulo-minhas-caixinhas">
          <Typography id="titulo-minhas-caixinhas" variant="h2" sx={{ mb: 3 }}>
            Minhas caixinhas
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 4 }}>
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

      </Stack>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
        <Typography variant="h1">Investimentos</Typography>
        {caixinhas.data && caixinhas.data.length > 0 && (
          <Button variant="outlined" startIcon={<AddRounded />} onClick={() => setDialogo({ tipo: "nova" })}>
            Caixinha
          </Button>
        )}
      </Box>
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
