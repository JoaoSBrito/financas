"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hojeEmSaoPaulo, type CaixinhaForm, type Data } from "@financas/core";
import {
  arquivarCaixinha,
  atualizarSaldoCaixinha,
  criarCaixinha,
  editarCaixinha,
  listarCaixinhas,
  listarMovimentosCaixinhas,
  movimentarCaixinha,
} from "@/services/caixinhas";
import { chavesContas } from "./useContas";

export const chavesCaixinhas = {
  caixinhas: ["caixinhas"] as const,
  movimentos: ["caixinhas", "movimentos"] as const,
};

export function useCaixinhas() {
  return useQuery({ queryKey: chavesCaixinhas.caixinhas, queryFn: listarCaixinhas });
}

export function useMovimentosCaixinhas() {
  return useQuery({ queryKey: chavesCaixinhas.movimentos, queryFn: listarMovimentosCaixinhas });
}

function useInvalidar() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["caixinhas"] });
    // Guardar e resgatar mexem no saldo da conta.
    void qc.invalidateQueries({ queryKey: chavesContas.contas });
    void qc.invalidateQueries({ queryKey: ["movimentos"] });
  };
}

export function useSalvarCaixinha() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (p: { id?: string; form: CaixinhaForm; saldoAtual: number }) =>
      p.id ? editarCaixinha(p.id, p.form) : criarCaixinha(p.form, p.saldoAtual, hojeEmSaoPaulo()).then(() => undefined),
    onSuccess: invalidar,
  });
}

export function useArquivarCaixinha() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: arquivarCaixinha, onSuccess: invalidar });
}

export function useMovimentarCaixinha() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (p: { caixinhaId: string; contaId: string; tipo: "deposito" | "resgate"; valor: number; data: Data }) =>
      movimentarCaixinha(p),
    onSuccess: invalidar,
  });
}

export function useAtualizarSaldoCaixinha() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (p: { caixinhaId: string; saldoReal: number }) => atualizarSaldoCaixinha(p.caixinhaId, p.saldoReal, hojeEmSaoPaulo()),
    onSuccess: invalidar,
  });
}
