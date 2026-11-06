"use client";

import { useQuery } from "@tanstack/react-query";
import type { Mes } from "@financas/core";
import { listarSaidasEntre } from "@/services/contas";
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

/** Saídas da conta num mês (pela data), para o orçamento por categoria. */
export function useSaidasDoMes(mes: Mes | undefined) {
  return useQuery({
    queryKey: ["movimentos", "saidas-mes", mes ?? "-"],
    queryFn: () => listarSaidasEntre(mes!, mes!),
    enabled: Boolean(mes),
  });
}
