"use client";

import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";
import { nomeDoMes, saldoInicialFaturaSchema, type Data, type Mes } from "@financas/core";
import { CampoMoeda, estiloPainel, PilulasSelecao, Valor } from "@financas/ui";
import { corDoCartao, paleta } from "@financas/ui/tokens";
import { useExcluirCompra } from "@/hooks/useFaturas";
import { useComprasDoInicio, useRegistrarSaldoInicial } from "@/hooks/useGastos";
import { faturasDeReferencia, type CartaoCompleto, type FaturaResumo } from "@/services/cartoes-mapeamento";
import type { CompraDoInicio } from "@/services/compras";
import { useAvisos } from "@/stores/avisos";
import { RodapePasso } from "./RodapePasso";

function SaldoDoCartao({
  cartao,
  indice,
  faturas,
  hoje,
  existentes,
}: {
  cartao: CartaoCompleto;
  indice: number;
  faturas: FaturaResumo[];
  hoje: Data;
  existentes: CompraDoInicio[];
}) {
  const ref = faturasDeReferencia(cartao, faturas, hoje);
  const [mes, setMes] = useState<Mes>(ref.aberta);
  const [valor, setValor] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const registrar = useRegistrarSaldoInicial();
  const excluir = useExcluirCompra();
  const mostrarAviso = useAvisos((s) => s.mostrar);
  const mesDaFatura = new Map(faturas.map((f) => [f.id, f.mes]));

  function adicionar() {
    const r = saldoInicialFaturaSchema.safeParse({ cartaoId: cartao.id, valor: valor ?? 0, mesFatura: mes });
    if (!r.success) {
      setErro(r.error.issues[0]?.message ?? "Valor inválido");
      return;
    }
    registrar.mutate(r.data, {
      onSuccess: () => {
        setValor(null);
        mostrarAviso(`Saldo adicionado à fatura de ${nomeDoMes(mes, false)}`);
      },
    });
  }

  const titulo = `${cartao.nome} · fatura de ${nomeDoMes(mes, false)}`;

  return (
    <Box component="section" aria-label={titulo} sx={{ ...estiloPainel, p: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      <Box component="h2" sx={{ m: 0, fontSize: 15, fontWeight: 500, display: "flex", alignItems: "center", gap: 2 }}>
        <Box component="span" aria-hidden sx={{ width: 4, height: 18, borderRadius: "2px", bgcolor: corDoCartao(indice) }} />
        {titulo}
      </Box>
      {existentes.map((c) => {
        const m = c.faturaIds[0] ? mesDaFatura.get(c.faturaIds[0]) : undefined;
        return (
          <Box key={c.id} sx={{ display: "flex", alignItems: "center", gap: 2, borderBottom: `1px solid ${paleta.divisor}`, pb: 2 }}>
            <Typography variant="body2" sx={{ flex: 1, color: "text.secondary" }}>
              Saldo inicial{m ? ` · fatura de ${nomeDoMes(m, false)}` : ""}
            </Typography>
            <Valor valor={c.valorTotal} sx={{ fontSize: 14 }} />
            <IconButton
              aria-label="Excluir saldo inicial"
              disabled={excluir.isPending}
              onClick={() => excluir.mutate(c.id, { onSuccess: () => mostrarAviso("Saldo inicial excluído") })}
            >
              <DeleteOutlineRounded fontSize="small" />
            </IconButton>
          </Box>
        );
      })}

      {ref.meses.length > 1 && (
        <PilulasSelecao
          rotulo={`Fatura do ${cartao.nome}`}
          tamanho="pequeno"
          valor={mes}
          onChange={setMes}
          opcoes={ref.meses.map((m) => ({
            valor: m,
            rotulo: `${nomeDoMes(m, false)}${m === ref.aberta ? " · aberta" : " · fechada"}`,
          }))}
        />
      )}
      <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
        <CampoMoeda
          label="Já está na fatura (sem as parcelas)"
          valor={valor}
          onChange={(v) => {
            setValor(v);
            setErro(null);
          }}
          error={Boolean(erro)}
          helperText={erro ?? "Fica sem categoria e fora do orçamento."}
          sx={{ flex: 1 }}
        />
        <Button variant="contained" onClick={adicionar} disabled={registrar.isPending} sx={{ flexShrink: 0, minHeight: 48 }}>
          {registrar.isPending ? "Salvando…" : "Adicionar"}
        </Button>
      </Box>
      {registrar.error && <Alert severity="error">{registrar.error.message}</Alert>}
    </Box>
  );
}

export function PassoFatura({
  cartoes,
  faturas,
  hoje,
  onContinuar,
}: {
  cartoes: CartaoCompleto[];
  faturas: FaturaResumo[];
  hoje: Data;
  onContinuar: () => void;
}) {
  const saldos = useComprasDoInicio("saldo_inicial");
  return (
    <Stack spacing={4}>
      {cartoes.map((c, i) => (
        <SaldoDoCartao
          key={c.id}
          cartao={c}
          indice={i}
          faturas={faturas.filter((f) => f.cartaoId === c.id)}
          hoje={hoje}
          existentes={(saldos.data ?? []).filter((s) => s.cartaoId === c.id)}
        />
      ))}
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Veja o valor parcial no app do banco. Ele entra como “saldo inicial”, sem categoria, só para a fatura bater. Prefere lançar um a um, com
        categoria?{" "}
        <Link href="/gastos/novo" style={{ color: "inherit" }}>
          Lançar gastos
        </Link>
      </Typography>
      <RodapePasso>
        <Button variant="contained" size="large" onClick={onContinuar}>
          Continuar
        </Button>
      </RodapePasso>
    </Stack>
  );
}
