"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { formatarDiaMes, hojeEmSaoPaulo, mesDe, type ItemProjetado } from "@financas/core";
import { CardSaldoProjetado, EstadoErro, EstadoVazio, ItemMovimento, Rotulo, SecaoCard, Valor } from "@financas/ui";
import { paleta, raio, semantica, tipografia } from "@financas/ui/tokens";
import GraficoDegraus from "@/componentes/graficos/GraficoDegraus";
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
        <Skeleton variant="rounded" height={240} />
        <Skeleton variant="rounded" height={300} />
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
      // Celular: uma coluna (Sobra, Lançar, Minhas contas, Próximos, Recorrentes).
      // Desktop: Lançar em cima; Sobra e Minhas contas lado a lado, na mesma altura;
      // Próximos movimentos e Recorrentes lado a lado, cada um com a sua altura.
      <Box
        sx={{
          display: "grid",
          gap: { xs: 3, md: 4 },
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 2fr) minmax(0, 1fr)" },
          gridTemplateAreas: { md: '"lancar lancar" "sobra contas" "proximos recorrentes"' },
        }}
      >
        <Box sx={{ gridArea: { md: "sobra" }, minWidth: 0, display: "flex", "& > *": { flex: 1 } }}>
        <CardSaldoProjetado
          ate={p.ate}
          saldoFinal={p.saldoFinal}
          saldoHoje={p.saldoHoje}
          entradas={p.entradasPrevistas}
          faturas={p.faturasAVencer}
          contasFixas={p.contasFixas}
          outros={p.outros}
          grafico={<GraficoDegraus hoje={hoje} ate={p.ate} saldoHoje={p.saldoHoje} pontos={p.itens.map((i) => ({ data: i.data, saldo: i.saldoApos }))} />}
        />
        </Box>
        {/* Lançar: controle segmentado, cada opção com o sinal na frente. */}
        <Box
          role="group"
          aria-label="Lançar"
          sx={{ gridArea: { md: "lancar" }, display: "grid", gridTemplateColumns: `repeat(${listaContas.length > 1 ? 3 : 2}, minmax(0, 1fr))`, border: `1px solid ${paleta.bordaControle}`, borderRadius: "8px", overflow: "hidden" }}
        >
          {[
            { sinal: "+", rotulo: "Entrada", cor: semantica.receita.texto, acao: () => setDialogo({ tipo: "movimento", mov: "entrada" }) },
            { sinal: "−", rotulo: "Saída / Pix", cor: paleta.texto, acao: () => setDialogo({ tipo: "movimento", mov: "saida" }) },
            ...(listaContas.length > 1 ? [{ sinal: "⇄", rotulo: "Transferir", cor: paleta.texto, acao: () => setDialogo({ tipo: "transferir" }) }] : []),
          ].map((b, i, todos) => (
            <ButtonBase
              key={b.rotulo}
              onClick={b.acao}
              sx={{ minHeight: 48, gap: 1.5, fontSize: 14, color: "text.primary", borderRight: i < todos.length - 1 ? `1px solid ${paleta.bordaControle}` : "none", "&:hover": { bgcolor: paleta.elevado } }}
            >
              <Box component="span" aria-hidden sx={{ fontFamily: tipografia.familiaMono, color: b.cor }}>
                {b.sinal}
              </Box>
              {b.rotulo}
            </ButtonBase>
          ))}
        </Box>

        <Box sx={{ gridArea: { md: "contas" }, minWidth: 0, display: "flex", "& > *": { flex: 1 } }}>
            <SecaoCard titulo="Minhas contas" gap={3}>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 2 }}>
                {listaContas.map((c) => {
                  const hojeConferida = c.conferidaEm === hoje;
                  return (
                    <ButtonBase
                      key={c.id}
                      onClick={() => setDialogo({ tipo: "ajustar", conta: c })}
                      sx={{ border: `1px solid ${paleta.divisor}`, borderRadius: "10px", bgcolor: paleta.fundo, p: 3.5, flexDirection: "column", alignItems: "flex-start", gap: 1.5, textAlign: "left", "&:hover": { borderColor: paleta.bordaControle } }}
                    >
                      <Typography sx={{ fontSize: 15 }}>{c.nome}</Typography>
                      <Valor valor={c.saldo} sx={{ fontSize: 18, fontWeight: 500 }} />
                      <Box component="span" sx={{ fontFamily: tipografia.familiaMono, fontSize: 10, textTransform: "uppercase", color: hojeConferida ? semantica.receita.texto : "text.secondary" }}>
                        {hojeConferida ? "✓ " : ""}
                        {diasDesde(c.conferidaEm, hoje)}
                      </Box>
                    </ButtonBase>
                  );
                })}
              </Box>
              <Typography variant="caption" component="p">
                Toque numa conta para conferir com o saldo do banco.
              </Typography>
            </SecaoCard>
        </Box>

        <Box sx={{ gridArea: { md: "proximos" }, alignSelf: "start", minWidth: 0, display: "flex", flexDirection: "column", gap: { xs: 3, md: 4 } }}>
            <SecaoCard titulo="Próximos movimentos" acao={<Rotulo aria-hidden>Valor · Saldo após</Rotulo>} gap={1}>
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
                      <ItemMovimento
                        descricao={i.descricao}
                        detalhe={`${formatarDiaMes(i.data)} · ${ROTULO_ORIGEM[i.origem]}${recorrente ? " · tocar para lançar" : agendado ? " · tocar para editar" : ""}`}
                        valor={i.valor}
                        saldoApos={i.saldoApos}
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
                    <ItemMovimento
                      descricao={m.descricao}
                      detalhe={`${formatarDiaMes(m.data)} · ${m.entreContas ? "entre contas" : ROTULO_TIPO[m.tipo]} · ${listaContas.find((c) => c.id === m.contaId)?.nome ?? ""}`}
                      valor={m.valor}
                      onAbrir={acaoDoMovimento(m) ? () => setDialogo(acaoDoMovimento(m)) : undefined}
                    />
                  </Box>
                ))
              )}
            </SecaoCard>
          </Box>

        <Box sx={{ gridArea: { md: "recorrentes" }, alignSelf: "start", minWidth: 0 }}>
            <SecaoCard
              titulo="Recorrentes"
              acao={
                <Button size="small" startIcon={<AddRounded />} onClick={() => setDialogo({ tipo: "recorrente" })}>
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
                      sx={{ width: "100%", justifyContent: "space-between", minHeight: 48, borderRadius: `${raio.controle}px` }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                        <Box component="span" sx={{ fontFamily: tipografia.familiaMono, fontSize: 11, textTransform: "uppercase", color: "text.secondary", minWidth: 44, textAlign: "left" }}>
                          Dia {r.dia}
                        </Box>
                        <Typography variant="body2" sx={{ fontSize: 14 }}>
                          {r.descricao}
                        </Typography>
                      </Box>
                      <Valor
                        valor={r.tipo === "entrada" ? r.valor : -r.valor}
                        sinal="sempre"
                        sx={{ fontSize: 14, color: r.tipo === "entrada" ? semantica.receita.texto : undefined }}
                      />
                    </ButtonBase>
                  </Box>
                ))
              )}
            </SecaoCard>
        </Box>
      </Box>
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
            categoriaId: dialogo.recorrente.categoriaId,
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
