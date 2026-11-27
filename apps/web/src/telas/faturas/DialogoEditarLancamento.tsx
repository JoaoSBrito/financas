"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { z } from "zod";
import { textoCurto } from "@financas/core";
import { FolhaInferior, Rotulo, SeletorCategoria, Valor } from "@financas/ui";
import { paleta } from "@financas/ui/tokens";
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
    <FolhaInferior
      aberta
      onFechar={onFechar}
      ocupado={ocupado}
      contexto={parcelado ? `Parcela ${lancamento.numero} de ${lancamento.totalParcelas}` : "Lançamento"}
      titulo={confirmandoExclusao ? "Excluir gasto?" : "Editar gasto"}
      onEnviar={confirmandoExclusao ? confirmarExclusao : salvar}
      acoes={
        confirmandoExclusao ? (
          <>
            <Button variant="outlined" onClick={() => setConfirmandoExclusao(false)} disabled={ocupado}>
              Voltar
            </Button>
            <Button type="submit" variant="outlined" color="error" disabled={ocupado}>
              {excluir.isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outlined" color="error" onClick={() => setConfirmandoExclusao(true)} disabled={ocupado}>
              Excluir
            </Button>
            <Button variant="outlined" onClick={onFechar} disabled={ocupado}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={ocupado}>
              {editar.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </>
        )
      }
    >
      {confirmandoExclusao ? (
        <Typography variant="body2">
          {parcelado
            ? `"${lancamento.descricao}" será excluído com todas as ${lancamento.totalParcelas} parcelas, em todas as faturas.`
            : `"${lancamento.descricao}" será excluído desta fatura.`}
        </Typography>
      ) : (
        <>
          <Box sx={{ border: `1px solid ${paleta.divisor}`, borderRadius: "10px", p: 3.5, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Rotulo>{parcelado ? "Valor da parcela" : "Valor"}</Rotulo>
            <Valor valor={lancamento.valor} sx={{ fontSize: 22, fontWeight: 500 }} />
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
          <SeletorCategoria opcoes={categorias} valor={categoriaId} onChange={setCategoriaId} />
          <Typography variant="caption" component="p">
            Para mudar valor, cartão ou parcelas, exclua e lance de novo.
          </Typography>
        </>
      )}
      {erro && <Alert severity="error">{erro}</Alert>}
    </FolhaInferior>
  );
}
