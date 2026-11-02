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
import { CampoMoeda, PilulasSelecao, SecaoCard, Valor } from "@financas/ui";
import { useExcluirCompra } from "@/hooks/useFaturas";
import { useComprasDoInicio, useRegistrarSaldoInicial } from "@/hooks/useGastos";
import { faturasDeReferencia, type CartaoCompleto, type FaturaResumo } from "@/services/cartoes-mapeamento";
import type { CompraDoInicio } from "@/services/compras";
import { useAvisos } from "@/stores/avisos";

function SaldoDoCartao({
  cartao,
  faturas,
  hoje,
  existentes,
}: {
  cartao: CartaoCompleto;
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

  return (
    <SecaoCard titulo={cartao.nome}>
      {existentes.map((c) => {
        const m = c.faturaIds[0] ? mesDaFatura.get(c.faturaIds[0]) : undefined;
        return (
          <Box key={c.id} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              Saldo inicial{m ? ` · fatura de ${nomeDoMes(m, false)}` : ""}
            </Typography>
            <Valor valor={c.valorTotal} sx={{ fontWeight: 700 }} />
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
          label={`Já gasto na fatura de ${nomeDoMes(mes, false)}`}
          valor={valor}
          onChange={(v) => {
            setValor(v);
            setErro(null);
          }}
          error={Boolean(erro)}
          helperText={erro ?? "Fica sem categoria e fora do orçamento."}
        />
        <Button variant="contained" onClick={adicionar} disabled={registrar.isPending} sx={{ flexShrink: 0, minHeight: 48 }}>
          {registrar.isPending ? "Salvando…" : "Adicionar"}
        </Button>
      </Box>
      {registrar.error && <Alert severity="error">{registrar.error.message}</Alert>}
    </SecaoCard>
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
      {cartoes.map((c) => (
        <SaldoDoCartao
          key={c.id}
          cartao={c}
          faturas={faturas.filter((f) => f.cartaoId === c.id)}
          hoje={hoje}
          existentes={(saldos.data ?? []).filter((s) => s.cartaoId === c.id)}
        />
      ))}
      <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary" }}>
        Prefere lançar um a um, com categoria?{" "}
        <Link href="/gastos/novo" style={{ color: "inherit", fontWeight: 700 }}>
          Lançar gastos
        </Link>
      </Typography>
      <Button variant="contained" size="large" onClick={onContinuar} sx={{ minHeight: 54, fontWeight: 800 }}>
        Continuar
      </Button>
    </Stack>
  );
}
