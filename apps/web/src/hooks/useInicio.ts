"use client";

import { useQuery } from "@tanstack/react-query";
import type { Mes } from "@financas/core";
import { listarLancamentosDoMes } from "@/services/faturas";
import { listarComprasRecentes, listarOrcamentosVigentes } from "@/services/inicio";

export function useLancamentosDoMes(mes: Mes | undefined) {
  return useQuery({
    // Prefixo "lancamentos": é invalidado junto quando um gasto muda.
    queryKey: ["lancamentos", "mes", mes ?? "-"],
    queryFn: () => listarLancamentosDoMes(mes!),
    enabled: Boolean(mes),
  });
}

export function useOrcamentos(mes: Mes | undefined) {
  return useQuery({
    queryKey: ["orcamentos", mes ?? "-"],
    queryFn: () => listarOrcamentosVigentes(mes!),
    enabled: Boolean(mes),
  });
}

export function useComprasRecentes() {
  return useQuery({ queryKey: ["lancamentos", "recentes"], queryFn: () => listarComprasRecentes(5) });
}
