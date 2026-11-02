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
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { categoriaFormSchema, nomeDoMes, type CategoriaForm, type Mes } from "@financas/core";
import { CampoMoeda } from "@financas/ui";
import { useArquivarCategoria, useSalvarCategoria } from "@/hooks/useCategorias";
import { useAvisos } from "@/stores/avisos";

export interface DialogoCategoriaProps {
  mes: Mes;
  /** Sem categoria = criar uma nova. */
  categoria?: { id: string; nome: string; orcamento: number | null };
  onFechar: () => void;
}

export function DialogoCategoria({ mes, categoria, onFechar }: DialogoCategoriaProps) {
  const salvar = useSalvarCategoria(mes);
  const arquivar = useArquivarCategoria();
  const mostrarAviso = useAvisos((s) => s.mostrar);
  const [confirmandoArquivo, setConfirmandoArquivo] = useState(false);
  const ocupado = salvar.isPending || arquivar.isPending;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoriaForm>({
    resolver: zodResolver(categoriaFormSchema),
    defaultValues: { nome: categoria?.nome ?? "", orcamentoMensal: categoria?.orcamento ?? null },
  });

  function enviar(form: CategoriaForm) {
    salvar.mutate(
      { id: categoria?.id, form, orcamentoAtual: categoria?.orcamento ?? null },
      {
        onSuccess: () => {
          mostrarAviso(categoria ? "Categoria atualizada" : "Categoria criada");
          onFechar();
        },
      },
    );
  }

  function confirmarArquivo() {
    if (!categoria) return;
    arquivar.mutate(categoria.id, {
      onSuccess: () => {
        mostrarAviso("Categoria arquivada");
        onFechar();
      },
    });
  }

  const erro = salvar.error?.message ?? arquivar.error?.message;

  return (
    <Dialog open onClose={ocupado ? undefined : onFechar} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit(enviar)} noValidate>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {confirmandoArquivo ? "Arquivar categoria?" : categoria ? "Editar categoria" : "Nova categoria"}
        </DialogTitle>
        <DialogContent>
          {confirmandoArquivo ? (
            <Typography variant="body2">
              &quot;{categoria?.nome}&quot; deixa de aparecer nas escolhas. Os gastos antigos continuam com ela.
            </Typography>
          ) : (
            <Stack spacing={4} sx={{ pt: 1 }}>
              <TextField label="Nome" error={Boolean(errors.nome)} helperText={errors.nome?.message} {...register("nome")} />
              <Controller
                control={control}
                name="orcamentoMensal"
                render={({ field, fieldState }) => (
                  <CampoMoeda
                    label="Orçamento mensal (opcional)"
                    valor={field.value}
                    onChange={(v) => field.onChange(v === 0 ? null : v)}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message ?? `Deixe em branco para não ter orçamento. Vale a partir da fatura de ${nomeDoMes(mes, false)}.`}
                  />
                )}
              />
            </Stack>
          )}
          {erro && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {erro}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 6, pb: 5, gap: 2, flexWrap: "wrap" }}>
          {confirmandoArquivo ? (
            <>
              <Button onClick={() => setConfirmandoArquivo(false)} disabled={ocupado}>
                Voltar
              </Button>
              <Button variant="contained" color="error" onClick={confirmarArquivo} disabled={ocupado}>
                {arquivar.isPending ? "Arquivando…" : "Arquivar"}
              </Button>
            </>
          ) : (
            <>
              {categoria && (
                <Button color="error" onClick={() => setConfirmandoArquivo(true)} disabled={ocupado} sx={{ mr: "auto" }}>
                  Arquivar
                </Button>
              )}
              <Button onClick={onFechar} disabled={ocupado}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={ocupado}>
                {salvar.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}
