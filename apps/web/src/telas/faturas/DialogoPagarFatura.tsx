"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";
import { dataSchema, hojeEmSaoPaulo, nomeDoMes } from "@financas/core";
import { PilulasSelecao, Valor } from "@financas/ui";
import { useContas, usePagamentoFatura } from "@/hooks/useContas";
import type { FaturaResumo } from "@/services/cartoes-mapeamento";
import { useAvisos } from "@/stores/avisos";

/** Pagamento = transferência da conta para o cartão (não é gasto de novo). */
export function DialogoPagarFatura({ fatura, total, onFechar }: { fatura: FaturaResumo; total: number; onFechar: () => void }) {
  const contas = useContas();
  const { pagar } = usePagamentoFatura();
  const aviso = useAvisos((s) => s.mostrar);
  const [contaId, setContaId] = useState<string | null>(null);
  const [data, setData] = useState(hojeEmSaoPaulo());
  const [erroData, setErroData] = useState<string | null>(null);
  const lista = contas.data ?? [];
  const conta = contaId ?? lista[0]?.id ?? null;

  function confirmar() {
    const r = dataSchema.safeParse(data);
    if (!r.success) {
      setErroData(r.error.issues[0]?.message ?? "Data inválida");
      return;
    }
    pagar.mutate(
      { faturaId: fatura.id, contaId: conta, data: r.data },
      {
        onSuccess: () => {
          aviso(conta ? "Fatura paga e saldo da conta atualizado" : "Fatura marcada como paga");
          onFechar();
        },
      },
    );
  }

  return (
    <Dialog open onClose={pagar.isPending ? undefined : onFechar} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Pagar fatura de {nomeDoMes(fatura.mes, false)}</DialogTitle>
      <DialogContent>
        <Stack spacing={4} sx={{ pt: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Valor
            </Typography>
            <Valor valor={total} sx={{ fontWeight: 800 }} />
          </Box>
          {contas.isPending ? null : lista.length === 0 ? (
            <Alert severity="info">
              Sem contas cadastradas: a fatura só será marcada como paga, sem mexer em saldo.{" "}
              <Link href="/contas" style={{ color: "inherit", fontWeight: 700 }}>
                Cadastrar conta
              </Link>
            </Alert>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Pago com
              </Typography>
              <PilulasSelecao
                rotulo="Conta de pagamento"
                tamanho="pequeno"
                valor={conta ?? ""}
                onChange={setContaId}
                opcoes={lista.map((c) => ({ valor: c.id, rotulo: c.nome }))}
              />
              <Typography variant="caption">Sai da conta como transferência: o gasto já foi contado nas compras.</Typography>
            </Stack>
          )}
          <TextField
            label="Data do pagamento"
            type="date"
            value={data}
            onChange={(e) => {
              setData(e.target.value);
              setErroData(null);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            error={Boolean(erroData)}
            helperText={erroData}
          />
          {pagar.error && <Alert severity="error">{pagar.error.message}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 6, pb: 5, gap: 2 }}>
        <Button onClick={onFechar} disabled={pagar.isPending}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={confirmar} disabled={pagar.isPending || contas.isPending}>
          {pagar.isPending ? "Salvando…" : "Confirmar pagamento"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
