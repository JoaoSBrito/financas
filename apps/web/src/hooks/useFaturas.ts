"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Data, Mes } from "@financas/core";
import {
  editarCompra,
  excluirCompra,
  listarLancamentos,
  marcarConferida,
  marcarFaturaPaga,
  type Lancamento,
} from "@/services/faturas";
import { chavesGastos } from "./useGastos";

export const chavesFaturas = {
  lancamentos: (cartaoId: string, aPartirDe: Mes) => ["lancamentos", cartaoId, aPartirDe] as const,
};

export function useLancamentos(cartaoId: string | undefined, aPartirDe: Mes) {
  return useQuery({
    queryKey: chavesFaturas.lancamentos(cartaoId ?? "-", aPartirDe),
    queryFn: () => listarLancamentos(cartaoId!, aPartirDe),
    enabled: Boolean(cartaoId),
  });
}

function useInvalidarTudo() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["lancamentos"] });
    void qc.invalidateQueries({ queryKey: chavesGastos.faturasResumo });
  };
}

/** Marca como conferido na hora (otimista) e desfaz se o servidor recusar. */
export function useMarcarConferida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; conferida: boolean }) => marcarConferida(p.id, p.conferida),
    onMutate: async ({ id, conferida }) => {
      await qc.cancelQueries({ queryKey: ["lancamentos"] });
      const anteriores = qc.getQueriesData<Lancamento[]>({ queryKey: ["lancamentos"] });
      qc.setQueriesData<Lancamento[]>({ queryKey: ["lancamentos"] }, (lista) =>
        lista?.map((l) => (l.id === id ? { ...l, conferida } : l)),
      );
      return { anteriores };
    },
    onError: (_e, _v, ctx) => ctx?.anteriores.forEach(([chave, dados]) => qc.setQueryData(chave, dados)),
    onSettled: () => void qc.invalidateQueries({ queryKey: chavesGastos.faturasResumo }),
  });
}

export function useMarcarFaturaPaga() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (p: { faturaId: string; pagaEm: Data | null }) => marcarFaturaPaga(p.faturaId, p.pagaEm),
    onSuccess: invalidar,
  });
}

export function useEditarCompra() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (p: { compraId: string; descricao: string; categoriaId: string | null }) =>
      editarCompra(p.compraId, p),
    onSuccess: invalidar,
  });
}

export function useExcluirCompra() {
  const invalidar = useInvalidarTudo();
  return useMutation({ mutationFn: (compraId: string) => excluirCompra(compraId), onSuccess: invalidar });
}
