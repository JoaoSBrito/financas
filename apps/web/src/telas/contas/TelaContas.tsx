"use client";

import AccountBalanceRounded from "@mui/icons-material/AccountBalanceRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import RemoveRounded from "@mui/icons-material/RemoveRounded";
import SwapHorizRounded from "@mui/icons-material/SwapHorizRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { formatarDiaMes, hojeEmSaoPaulo, mesDe, type ItemProjetado } from "@financas/core";
import { CardSaldoProjetado, EstadoErro, EstadoVazio, ItemLancamento, SecaoCard, Valor } from "@financas/ui";
import { cores } from "@financas/ui/tokens";
import { useContas, useMovimentosDoMes, useProjecao, useRecorrentes } from "@/hooks/useContas";
import type { Conta, MovimentoConta, Recorrente } from "@/services/contas";
import {
  DialogoAjustarSaldo,
  DialogoDesfazerTransferencia,
  DialogoExcluirMovimento,
  DialogoMovimento,
  DialogoNovaConta,
  DialogoRecorrente,
  DialogoTransferir,
} from "./Dialogos";

type Dialogo =
  | { tipo: "nova-conta" }
  | { tipo: "ajustar"; conta: Conta }
  | { tipo: "movimento"; mov: "entrada" | "saida" }
  | { tipo: "lancar"; recorrente: Recorrente; data: string }
  | { tipo: "recorrente"; recorrente?: Recorrente }
  | { tipo: "excluir"; movimento: MovimentoConta }
  | { tipo: "transferir" }
  | { tipo: "editar-mov"; movimento: MovimentoConta }
  | { tipo: "desfazer"; movimento: MovimentoConta }
  | null;

function diasDesde(data: string | null, hoje: string): string {
  if (!data) return "Nunca conferida";
  const dias = Math.round((Date.parse(hoje) - Date.parse(data)) / 86_400_000);
  return dias <= 0 ? "Conferida hoje" : dias === 1 ? "Conferida ontem" : `Conferida há ${dias} dias`;
}

const ROTULO_ORIGEM: Record<ItemProjetado["origem"], string> = { recorrente: "recorrente", fatura: "fatura do cartão", agendado: "agendado" };
const ROTULO_TIPO: Record<MovimentoConta["tipo"], string> = {
  saldo_inicial: "saldo inicial",
  entrada: "entrada",
  saida: "saída",
  transferencia: "transferência",
  ajuste: "ajuste",
};

/** O que acontece ao tocar num movimento já lançado (realizado ou agendado). */
function acaoDoMovimento(m: MovimentoConta): Dialogo {
  if (m.entreContas) return { tipo: "desfazer", movimento: m };
  if (m.tipo === "entrada" || m.tipo === "saida") return { tipo: "editar-mov", movimento: m };
  if (m.tipo === "transferencia") return null; // fatura e caixinha se desfazem pela origem
  return { tipo: "excluir", movimento: m };
}

export function TelaContas() {
  const hoje = hojeEmSaoPaulo();
  const contas = useContas();
  const recorrentes = useRecorrentes();
  const movimentos = useMovimentosDoMes(mesDe(hoje));
  const projecao = useProjecao();
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const fechar = () => setDialogo(null);

  const cabecalho = (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
      <Typography variant="h1">Contas</Typography>
      {contas.data && contas.data.length > 0 && (
        <Button variant="outlined" startIcon={<AddRounded />} onClick={() => setDialogo({ tipo: "nova-conta" })}>
          Conta
        </Button>
      )}
    </Box>
  );

  let corpo: React.ReactNode;
  if (projecao.isPending) {
    corpo = (
      <Stack spacing={4} aria-busy="true" aria-label="Carregando">
        <Skeleton variant="rounded" height={240} sx={{ borderRadius: 5 }} />
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 5 }} />
      </Stack>
    );
  } else if (projecao.isError) {
    corpo = <EstadoErro mensagem="Não foi possível carregar suas contas." onTentarNovamente={projecao.refetch} />;
  } else if (!contas.data || contas.data.length === 0 || !projecao.data) {
    corpo = (
      <SecaoCard>
        <EstadoVazio
          titulo="Cadastre sua conta"
          descricao="Com o saldo de hoje, o app calcula quanto sobra até o fim do mês depois das faturas e contas fixas."
          acao={
            <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDialogo({ tipo: "nova-conta" })}>
              Cadastrar conta
            </Button>
          }
        />
      </SecaoCard>
    );
  } else {
    const p = projecao.data;
    const listaContas = contas.data;
    const realizados = (movimentos.data ?? []).filter((m) => m.data <= hoje);
    const daConta = (recorrentes.data ?? []).filter((r) => r.contaId);

    corpo = (
      <Stack spacing={4}>
        <CardSaldoProjetado
          ate={p.ate}
          saldoFinal={p.saldoFinal}
          saldoHoje={p.saldoHoje}
          entradas={p.entradasPrevistas}
          faturas={p.faturasAVencer}
          contasFixas={p.contasFixas}
          outros={p.outros}
        />
        <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${listaContas.length > 1 ? 3 : 2}, minmax(0, 1fr))`, gap: 3 }}>
          <Button variant="outlined" startIcon={<AddRounded />} onClick={() => setDialogo({ tipo: "movimento", mov: "entrada" })} sx={{ minHeight: 50, color: cores.investimento, borderColor: cores.bordaForte, bgcolor: "background.paper" }}>
            Entrada
          </Button>
          <Button variant="outlined" startIcon={<RemoveRounded />} onClick={() => setDialogo({ tipo: "movimento", mov: "saida" })} sx={{ minHeight: 50, color: "text.primary", borderColor: cores.bordaForte, bgcolor: "background.paper" }}>
            Saída / Pix
          </Button>
          {listaContas.length > 1 && (
            <Button variant="outlined" startIcon={<SwapHorizRounded />} onClick={() => setDialogo({ tipo: "transferir" })} sx={{ minHeight: 50, color: "text.primary", borderColor: cores.bordaForte, bgcolor: "background.paper" }}>
              Transferir
            </Button>
          )}
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "flex-start" }}>
          <Stack spacing={4} sx={{ flex: "2 1 460px", minWidth: 0 }}>
            <SecaoCard titulo="Próximos movimentos" acao={<Typography variant="caption">saldo após</Typography>} gap={1}>
              {p.itens.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Nada previsto até {formatarDiaMes(p.ate)}.
                </Typography>
              ) : (
                p.itens.map((i, n) => {
                  const recorrente = i.origem === "recorrente" ? daConta.find((r) => r.id === i.referencia) : undefined;
                  const agendado = i.origem === "agendado" ? (movimentos.data ?? []).find((m) => m.id === i.referencia) : undefined;
                  const abrir = recorrente
                    ? () => setDialogo({ tipo: "lancar", recorrente, data: i.data })
                    : agendado && acaoDoMovimento(agendado)
                      ? () => setDialogo(acaoDoMovimento(agendado))
                      : undefined;
                  return (
                    <Box key={`${i.data}-${i.descricao}-${n}`}>
                      {n > 0 && <Divider />}
                      <ItemLancamento
                        descricao={i.descricao}
                        detalhe={`${formatarDiaMes(i.data)} · ${ROTULO_ORIGEM[i.origem]}${recorrente ? " · tocar para lançar" : agendado ? " · tocar para editar" : ""}`}
                        valor={i.valor}
                        sinal="sempre"
                        corValor={i.valor > 0 ? cores.investimento : undefined}
                        extra={
                          <Typography variant="caption" sx={{ color: i.saldoApos < 0 ? "error.main" : undefined }}>
                            <Valor valor={i.saldoApos} sx={{ font: "inherit" }} />
                          </Typography>
                        }
                        onAbrir={abrir}
                      />
                    </Box>
                  );
                })
              )}
              {p.itens.some((i) => i.origem === "fatura") && (
                <Typography variant="caption" component="p" sx={{ pt: 2 }}>
                  Faturas são pagas em Cartões, com &quot;Marcar como paga&quot;. Não contam como gasto de novo.
                </Typography>
              )}
            </SecaoCard>

            <SecaoCard titulo="Movimentos do mês" gap={1}>
              {realizados.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Nenhum movimento neste mês.
                </Typography>
              ) : (
                realizados.slice(0, 15).map((m, n) => (
                  <Box key={m.id}>
                    {n > 0 && <Divider />}
                    <ItemLancamento
                      descricao={m.descricao}
                      detalhe={`${formatarDiaMes(m.data)} · ${m.entreContas ? "entre contas" : ROTULO_TIPO[m.tipo]} · ${listaContas.find((c) => c.id === m.contaId)?.nome ?? ""}`}
                      valor={m.valor}
                      sinal="sempre"
                      corValor={m.valor > 0 ? cores.investimento : undefined}
                      onAbrir={acaoDoMovimento(m) ? () => setDialogo(acaoDoMovimento(m)) : undefined}
                    />
                  </Box>
                ))
              )}
            </SecaoCard>
          </Stack>

          <Stack spacing={4} sx={{ flex: "1 1 300px", minWidth: 0 }}>
            <SecaoCard titulo="Minhas contas" gap={1}>
              {listaContas.map((c, n) => (
                <Box key={c.id}>
                  {n > 0 && <Divider />}
                  <ButtonBase
                    onClick={() => setDialogo({ tipo: "ajustar", conta: c })}
                    sx={{ width: "100%", gap: 3, minHeight: 64, borderRadius: 2, justifyContent: "flex-start", textAlign: "left" }}
                  >
                    <Box aria-hidden sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: cores.primariaClara, color: cores.primaria, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AccountBalanceRounded fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1">{c.nome}</Typography>
                      <Typography variant="caption">{diasDesde(c.conferidaEm, hoje)}</Typography>
                    </Box>
                    <Valor valor={c.saldo} sx={{ fontSize: 15, fontWeight: 800 }} />
                  </ButtonBase>
                </Box>
              ))}
              <Typography variant="caption" component="p" sx={{ pt: 2 }}>
                Toque numa conta para conferir com o saldo do banco.
              </Typography>
            </SecaoCard>

            <SecaoCard
              titulo="Recorrentes"
              acao={
                <Button size="small" startIcon={<AddRounded />} onClick={() => setDialogo({ tipo: "recorrente" })} sx={{ minHeight: 36 }}>
                  Recorrente
                </Button>
              }
              gap={1}
            >
              {daConta.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Cadastre salário, aluguel e outras contas fixas para o saldo projetado considerar.
                </Typography>
              ) : (
                daConta.map((r, n) => (
                  <Box key={r.id}>
                    {n > 0 && <Divider />}
                    <ButtonBase
                      onClick={() => setDialogo({ tipo: "recorrente", recorrente: r })}
                      sx={{ width: "100%", justifyContent: "space-between", minHeight: 48, borderRadius: 2 }}
                    >
                      <Typography variant="body2">
                        {r.descricao} · dia {r.dia}
                      </Typography>
                      <Valor
                        valor={r.tipo === "entrada" ? r.valor : -r.valor}
                        sinal="sempre"
                        sx={{ fontSize: 14, fontWeight: 700, color: r.tipo === "entrada" ? cores.investimento : undefined }}
                      />
                    </ButtonBase>
                  </Box>
                ))
              )}
            </SecaoCard>
          </Stack>
        </Box>
      </Stack>
    );
  }

  return (
    <>
      {cabecalho}
      {corpo}
      {dialogo?.tipo === "nova-conta" && <DialogoNovaConta onFechar={fechar} />}
      {dialogo?.tipo === "ajustar" && <DialogoAjustarSaldo conta={dialogo.conta} onFechar={fechar} />}
      {dialogo?.tipo === "movimento" && <DialogoMovimento tipo={dialogo.mov} contas={contas.data ?? []} onFechar={fechar} />}
      {dialogo?.tipo === "lancar" && (
        <DialogoMovimento
          tipo={dialogo.recorrente.tipo}
          contas={contas.data ?? []}
          recorrenteId={dialogo.recorrente.id}
          inicial={{
            valor: dialogo.recorrente.valor,
            descricao: dialogo.recorrente.descricao,
            data: dialogo.data < hoje ? dialogo.data : hoje,
            contaId: dialogo.recorrente.contaId ?? undefined,
          }}
          onFechar={fechar}
        />
      )}
      {dialogo?.tipo === "recorrente" && <DialogoRecorrente contas={contas.data ?? []} recorrente={dialogo.recorrente} onFechar={fechar} />}
      {dialogo?.tipo === "excluir" && <DialogoExcluirMovimento movimento={dialogo.movimento} onFechar={fechar} />}
      {dialogo?.tipo === "editar-mov" && (
        <DialogoMovimento
          tipo={dialogo.movimento.tipo === "entrada" ? "entrada" : "saida"}
          contas={contas.data ?? []}
          movimento={dialogo.movimento}
          onFechar={fechar}
        />
      )}
      {dialogo?.tipo === "transferir" && <DialogoTransferir contas={contas.data ?? []} onFechar={fechar} />}
      {dialogo?.tipo === "desfazer" && <DialogoDesfazerTransferencia movimento={dialogo.movimento} onFechar={fechar} />}
    </>
  );
}
