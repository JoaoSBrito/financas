"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Radio from "@mui/material/Radio";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";
import { dataSchema, hojeEmSaoPaulo, nomeDoMes } from "@financas/core";
import { FolhaInferior, Rotulo, Valor } from "@financas/ui";
import { paleta, tipografia } from "@financas/ui/tokens";
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
    <FolhaInferior
      aberta
      onFechar={onFechar}
      ocupado={pagar.isPending}
      contexto={`Fatura de ${nomeDoMes(fatura.mes, false)}`}
      titulo="Pagar fatura"
      onEnviar={confirmar}
      acoes={
        <>
          <Button variant="outlined" onClick={onFechar} disabled={pagar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={pagar.isPending || contas.isPending}>
            {pagar.isPending ? "Salvando…" : "Confirmar pagamento"}
          </Button>
        </>
      }
    >
      <Box sx={{ border: `1px solid ${paleta.divisor}`, borderRadius: "10px", p: 3.5, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Rotulo>Valor</Rotulo>
        <Valor valor={total} sx={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em" }} />
      </Box>
      {contas.isPending ? null : lista.length === 0 ? (
        <Alert severity="info">
          Sem contas cadastradas: a fatura só será marcada como paga, sem mexer em saldo.{" "}
          <Link href="/contas" style={{ color: "inherit" }}>
            Cadastrar conta
          </Link>
        </Alert>
      ) : (
        <Box component="fieldset" sx={{ m: 0, p: 0, border: "none", display: "flex", flexDirection: "column" }}>
          <Rotulo component="legend" sx={{ mb: 1 }}>
            Sai da conta
          </Rotulo>
          {lista.map((c, i) => (
            <Box
              key={c.id}
              component="label"
              sx={{ display: "grid", gridTemplateColumns: "24px minmax(0, 1fr) auto", alignItems: "center", columnGap: 2.5, minHeight: 52, cursor: "pointer", borderBottom: i < lista.length - 1 ? `1px solid ${paleta.divisor}` : "none" }}
            >
              <Radio checked={conta === c.id} onChange={() => setContaId(c.id)} name="conta-pagamento" sx={{ p: 0 }} slotProps={{ input: { "aria-label": c.nome } }} />
              <Typography sx={{ fontSize: 15 }}>{c.nome}</Typography>
              <Box sx={{ fontFamily: tipografia.familiaMono, fontSize: 13, color: "text.secondary" }}>
                <Valor valor={c.saldo} sx={{ font: "inherit" }} />
                {conta === c.id && (
                  <>
                    <span aria-label="passa para"> → </span>
                    <Valor valor={c.saldo - total} sx={{ font: "inherit", color: "text.primary" }} />
                  </>
                )}
              </Box>
            </Box>
          ))}
        </Box>
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
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        É uma transferência da conta para o cartão: não conta como gasto de novo.
      </Typography>
      {pagar.error && <Alert severity="error">{pagar.error.message}</Alert>}
    </FolhaInferior>
  );
}
