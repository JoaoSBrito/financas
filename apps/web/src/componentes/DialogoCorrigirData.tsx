"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
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
    <Dialog open={aberto} onClose={salvando ? undefined : onFechar} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit(onConfirmar)} noValidate>
        <DialogTitle sx={{ fontWeight: 800 }}>Fatura de {nomeMes}</DialogTitle>
        <DialogContent>
          <Stack spacing={4} sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Use as datas que aparecem no app do banco. Só esta fatura muda; as compras afetadas vão para a fatura
              certa.
            </Typography>
            {erro && <Alert severity="error">{erro}</Alert>}
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 6, pb: 5, gap: 2 }}>
          <Button onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            {salvando ? "Salvando…" : "Confirmar datas"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
