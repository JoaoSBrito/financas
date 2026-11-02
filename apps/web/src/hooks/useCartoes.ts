"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CartaoForm, Data, Mes } from "@financas/core";
import {
  atualizarCartao,
  corrigirFatura,
  criarCartao,
  listarCartoes,
  listarFaturas,
  obterCartao,
} from "@/services/cartoes";
import { chavesGastos } from "./useGastos";

export const chaves = {
  cartoes: ["cartoes"] as const,
  cartao: (id: string) => ["cartoes", id] as const,
  faturas: (cartaoId: string) => ["faturas", cartaoId] as const,
};

export function useCartoes() {
  return useQuery({ queryKey: chaves.cartoes, queryFn: listarCartoes });
}

export function useCartao(id: string | undefined) {
  return useQuery({
    queryKey: chaves.cartao(id ?? "novo"),
    queryFn: () => obterCartao(id!),
    enabled: Boolean(id),
  });
}

export function useFaturasDoCartao(cartaoId: string | undefined) {
  return useQuery({
    queryKey: chaves.faturas(cartaoId ?? "novo"),
    queryFn: () => listarFaturas(cartaoId!),
    enabled: Boolean(cartaoId),
  });
}

/** Cria (sem id) ou atualiza (com id) um cartão e regenera as faturas futuras. */
export function useSalvarCartao(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: CartaoForm) => {
      if (id) {
        await atualizarCartao(id, form);
        return id;
      }
      return criarCartao(form);
    },
    onSuccess: (cartaoId) => {
      void qc.invalidateQueries({ queryKey: chaves.cartoes });
      void qc.invalidateQueries({ queryKey: chaves.faturas(cartaoId) });
      void qc.invalidateQueries({ queryKey: chavesGastos.faturasResumo });
      void qc.invalidateQueries({ queryKey: ["lancamentos"] });
    },
  });
}

export function useCorrigirFatura(cartaoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { mes: Mes; fechamento: Data; vencimento: Data }) => corrigirFatura({ cartaoId, ...p }),
    onSuccess: () => {
      // Corrigir uma data pode mover compras entre faturas.
      void qc.invalidateQueries({ queryKey: chaves.faturas(cartaoId) });
      void qc.invalidateQueries({ queryKey: chavesGastos.faturasResumo });
      void qc.invalidateQueries({ queryKey: ["lancamentos"] });
    },
  });
}
