"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CategoriaForm, Mes } from "@financas/core";
import { arquivarCategoria, atualizarCategoria, criarCategoria } from "@/services/categorias";
import { chavesGastos } from "./useGastos";

function useInvalidar() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: chavesGastos.categorias });
    void qc.invalidateQueries({ queryKey: ["orcamentos"] });
  };
}

export function useSalvarCategoria(mes: Mes) {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (p: { id?: string; form: CategoriaForm; orcamentoAtual: number | null }) =>
      p.id ? atualizarCategoria(p.id, p.form, mes, p.orcamentoAtual) : criarCategoria(p.form, mes).then(() => undefined),
    onSuccess: invalidar,
  });
}

export function useArquivarCategoria() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: arquivarCategoria, onSuccess: invalidar });
}
