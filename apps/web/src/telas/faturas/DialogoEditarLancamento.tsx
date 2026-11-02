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
import { useState } from "react";
import { z } from "zod";
import { textoCurto } from "@financas/core";
import { ChipsCategoria, Valor } from "@financas/ui";
import { useEditarCompra, useExcluirCompra } from "@/hooks/useFaturas";
import type { Categoria } from "@/services/categorias";
import type { Lancamento } from "@/services/faturas";
import { useAvisos } from "@/stores/avisos";

const descricaoSchema = textoCurto(80, "uma descrição");

export interface DialogoEditarLancamentoProps {
  lancamento: Lancamento;
  categorias: Categoria[];
  onFechar: () => void;
}

/** Edita descrição e categoria; valor, cartão e parcelas mudam excluindo e lançando de novo. */
export function DialogoEditarLancamento({ lancamento, categorias, onFechar }: DialogoEditarLancamentoProps) {
  const [descricao, setDescricao] = useState(lancamento.descricao);
  const [categoriaId, setCategoriaId] = useState(lancamento.categoriaId);
  const [erroDescricao, setErroDescricao] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const editar = useEditarCompra();
  const excluir = useExcluirCompra();
  const mostrarAviso = useAvisos((s) => s.mostrar);
  const ocupado = editar.isPending || excluir.isPending;
  const parcelado = lancamento.totalParcelas > 1;

  function salvar() {
    const r = descricaoSchema.safeParse(descricao);
    if (!r.success) {
      setErroDescricao(r.error.issues[0]?.message ?? "Descrição inválida");
      return;
    }
    editar.mutate(
      { compraId: lancamento.compraId, descricao: r.data, categoriaId },
      {
        onSuccess: () => {
          mostrarAviso("Gasto atualizado");
          onFechar();
        },
      },
    );
  }

  function confirmarExclusao() {
    excluir.mutate(lancamento.compraId, {
      onSuccess: () => {
        mostrarAviso(parcelado ? "Gasto e parcelas excluídos" : "Gasto excluído");
        onFechar();
      },
    });
  }

  const erro = editar.error?.message ?? excluir.error?.message;

  return (
    <Dialog open onClose={ocupado ? undefined : onFechar} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>{confirmandoExclusao ? "Excluir gasto?" : "Editar gasto"}</DialogTitle>
      <DialogContent>
        {confirmandoExclusao ? (
          <Typography variant="body2">
            {parcelado
              ? `"${lancamento.descricao}" será excluído com todas as ${lancamento.totalParcelas} parcelas, em todas as faturas.`
              : `"${lancamento.descricao}" será excluído desta fatura.`}
          </Typography>
        ) : (
          <Stack spacing={4} sx={{ pt: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {parcelado ? `Parcela ${lancamento.numero} de ${lancamento.totalParcelas}` : "Valor"}
              </Typography>
              <Valor valor={lancamento.valor} sx={{ fontWeight: 800 }} />
            </Box>
            <TextField
              label="Descrição"
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                setErroDescricao(null);
              }}
              error={Boolean(erroDescricao)}
              helperText={erroDescricao}
            />
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Categoria
              </Typography>
              <ChipsCategoria rotulo="Categoria" opcoes={categorias} valor={categoriaId} onChange={setCategoriaId} />
            </Stack>
            <Typography variant="caption" component="p">
              Para mudar valor, cartão ou parcelas, exclua e lance de novo.
            </Typography>
          </Stack>
        )}
        {erro && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {erro}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 6, pb: 5, gap: 2, flexWrap: "wrap" }}>
        {confirmandoExclusao ? (
          <>
            <Button onClick={() => setConfirmandoExclusao(false)} disabled={ocupado}>
              Voltar
            </Button>
            <Button variant="contained" color="error" onClick={confirmarExclusao} disabled={ocupado}>
              {excluir.isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </>
        ) : (
          <>
            <Button color="error" onClick={() => setConfirmandoExclusao(true)} disabled={ocupado} sx={{ mr: "auto" }}>
              Excluir
            </Button>
            <Button onClick={onFechar} disabled={ocupado}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={salvar} disabled={ocupado}>
              {editar.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
