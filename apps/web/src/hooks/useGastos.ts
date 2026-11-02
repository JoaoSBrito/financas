"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NovoGasto, ParcelamentoEmAndamento, SaldoInicialFatura } from "@financas/core";
import { listarCategorias } from "@/services/categorias";
import {
  listarComprasDoInicio,
  listarFaturasResumo,
  registrarGasto,
  registrarParcelamentoEmAndamento,
  registrarSaldoInicial,
} from "@/services/compras";

export const chavesGastos = {
  categorias: ["categorias"] as const,
  faturasResumo: ["faturas-resumo"] as const,
};

export function useCategorias() {
  return useQuery({ queryKey: chavesGastos.categorias, queryFn: listarCategorias, staleTime: 5 * 60_000 });
}

export function useFaturasResumo() {
  return useQuery({ queryKey: chavesGastos.faturasResumo, queryFn: listarFaturasResumo });
}

export function useRegistrarGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (g: NovoGasto) => registrarGasto(g),
    onSuccess: () => {
      // Faturas, limites e listas de lançamentos mudam com um gasto novo.
      void qc.invalidateQueries({ queryKey: chavesGastos.faturasResumo });
      void qc.invalidateQueries({ queryKey: ["faturas"] });
      void qc.invalidateQueries({ queryKey: ["lancamentos"] });
    },
  });
}

export function useRegistrarParcelamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: ParcelamentoEmAndamento) => registrarParcelamentoEmAndamento(p),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chavesGastos.faturasResumo });
      void qc.invalidateQueries({ queryKey: ["faturas"] });
      void qc.invalidateQueries({ queryKey: ["lancamentos"] });
    },
  });
}

export function useComprasDoInicio(origem: "anterior_ao_app" | "saldo_inicial") {
  // Prefixo "lancamentos": atualiza junto quando algo é lançado ou excluído.
  return useQuery({ queryKey: ["lancamentos", "inicio", origem], queryFn: () => listarComprasDoInicio(origem) });
}

export function useRegistrarSaldoInicial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: SaldoInicialFatura) => registrarSaldoInicial(p),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chavesGastos.faturasResumo });
      void qc.invalidateQueries({ queryKey: ["faturas"] });
      void qc.invalidateQueries({ queryKey: ["lancamentos"] });
    },
  });
}
