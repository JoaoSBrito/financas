"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { FolhaInferior, SeloStatus } from "@financas/ui";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { dataSchema, type Data } from "@financas/core";

const schema = z
  .object({ fechamento: dataSchema, vencimento: dataSchema })
  .refine((v) => v.fechamento < v.vencimento, {
    path: ["vencimento"],
    message: "O vencimento precisa ser depois do fechamento",
  });
type Datas = z.infer<typeof schema>;

export interface DialogoCorrigirDataProps {
  aberto: boolean;
  /** Ex.: "dezembro de 2026". */
  nomeMes: string;
  fechamento: Data;
  vencimento: Data;
  salvando?: boolean;
  erro?: string | null;
  onFechar: () => void;
  onConfirmar: (datas: Datas) => void;
}

/** Corrige as datas de uma fatura e a marca como confirmada. */
export function DialogoCorrigirData({
  aberto,
  nomeMes,
  fechamento,
  vencimento,
  salvando = false,
  erro,
  onFechar,
  onConfirmar,
}: DialogoCorrigirDataProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Datas>({ resolver: zodResolver(schema), defaultValues: { fechamento, vencimento } });

  useEffect(() => {
    if (aberto) reset({ fechamento, vencimento });
  }, [aberto, fechamento, vencimento, reset]);

  return (
    <FolhaInferior
      aberta={aberto}
      onFechar={onFechar}
      ocupado={salvando}
      contexto={`Fatura de ${nomeMes}`}
      titulo="Corrigir datas"
      onEnviar={handleSubmit(onConfirmar)}
      acoes={
        <>
          <Button variant="outlined" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            {salvando ? "Salvando…" : "Confirmar datas"}
          </Button>
        </>
      }
    >
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Use as datas que aparecem no app do banco. Só esta fatura muda; as compras afetadas vão para a fatura certa.
      </Typography>
      {erro && <Alert severity="error">{erro}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 2.5 }}>
        <TextField
          label="Fechamento"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          error={Boolean(errors.fechamento)}
          helperText={errors.fechamento?.message}
          {...register("fechamento")}
        />
        <TextField
          label="Vencimento"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          error={Boolean(errors.vencimento)}
          helperText={errors.vencimento?.message}
          {...register("vencimento")}
        />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <SeloStatus status="estimado" />
        <Typography component="span" aria-hidden sx={{ color: "text.secondary" }}>
          →
        </Typography>
        <SeloStatus status="confirmado" />
      </Box>
    </FolhaInferior>
  );
}
