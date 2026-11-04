"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  hojeEmSaoPaulo,
  mesDe,
  projetarFimDoMes,
  type ContaForm,
  type Data,
  type MovimentoForm,
  type ProjecaoDoMes,
  type RecorrenteForm,
  type TransferenciaEntreContas,
} from "@financas/core";
import {
  ajustarSaldo,
  criarConta,
  desfazerTransferencia,
  transferirEntreContas,
  desativarRecorrente,
  desfazerPagamento,
  excluirMovimento,
  listarContas,
  listarMovimentosDoMes,
  listarRecorrentes,
  pagarFatura,
  registrarMovimento,
  salvarRecorrente,
} from "@/services/contas";
import { useCartoes } from "./useCartoes";
import { chavesGastos, useFaturasResumo } from "./useGastos";

export const chavesContas = {
  contas: ["contas"] as const,
  movimentos: (mes: string) => ["movimentos", mes] as const,
  recorrentes: ["recorrentes"] as const,
};

export function useContas() {
  return useQuery({ queryKey: chavesContas.contas, queryFn: listarContas });
}

export function useMovimentosDoMes(mes: string) {
  return useQuery({ queryKey: chavesContas.movimentos(mes), queryFn: () => listarMovimentosDoMes(mes) });
}

export function useRecorrentes() {
  return useQuery({ queryKey: chavesContas.recorrentes, queryFn: listarRecorrentes });
}

function useInvalidarContas() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: chavesContas.contas });
    void qc.invalidateQueries({ queryKey: ["movimentos"] });
    void qc.invalidateQueries({ queryKey: chavesContas.recorrentes });
  };
}

export function useCriarConta() {
  const invalidar = useInvalidarContas();
  return useMutation({ mutationFn: (f: ContaForm) => criarConta(f), onSuccess: invalidar });
}

export function useAjustarSaldo() {
  const invalidar = useInvalidarContas();
  return useMutation({
    mutationFn: (p: { contaId: string; saldoReal: number }) => ajustarSaldo(p.contaId, p.saldoReal, hojeEmSaoPaulo()),
    onSuccess: invalidar,
  });
}

export function useRegistrarMovimento() {
  const invalidar = useInvalidarContas();
  return useMutation({
    mutationFn: (p: { form: MovimentoForm; recorrenteId?: string }) => registrarMovimento(p.form, p.recorrenteId),
    onSuccess: invalidar,
  });
}

export function useExcluirMovimento() {
  const invalidar = useInvalidarContas();
  return useMutation({ mutationFn: excluirMovimento, onSuccess: invalidar });
}

export function useSalvarRecorrente() {
  const invalidar = useInvalidarContas();
  return useMutation({ mutationFn: (p: { id?: string; form: RecorrenteForm }) => salvarRecorrente(p.id, p.form), onSuccess: invalidar });
}

export function useDesativarRecorrente() {
  const invalidar = useInvalidarContas();
  return useMutation({ mutationFn: desativarRecorrente, onSuccess: invalidar });
}

export function useTransferirEntreContas() {
  const invalidar = useInvalidarContas();
  return useMutation({ mutationFn: (t: TransferenciaEntreContas) => transferirEntreContas(t), onSuccess: invalidar });
}

export function useDesfazerTransferencia() {
  const invalidar = useInvalidarContas();
  return useMutation({ mutationFn: desfazerTransferencia, onSuccess: invalidar });
}

/** Pagar fatura mexe no saldo da conta e na fatura ao mesmo tempo. */
export function usePagamentoFatura() {
  const qc = useQueryClient();
  const invalidarContas = useInvalidarContas();
  const depois = () => {
    invalidarContas();
    void qc.invalidateQueries({ queryKey: chavesGastos.faturasResumo });
    void qc.invalidateQueries({ queryKey: ["faturas"] });
  };
  const pagar = useMutation({
    mutationFn: (p: { faturaId: string; contaId: string | null; data: Data }) => pagarFatura(p.faturaId, p.contaId, p.data),
    onSuccess: depois,
  });
  const desfazer = useMutation({ mutationFn: desfazerPagamento, onSuccess: depois });
  return { pagar, desfazer };
}

/** Junta contas, recorrentes, movimentos e faturas no saldo projetado até o fim do mês. */
export function useProjecao(): {
  isPending: boolean;
  isError: boolean;
  /** null quando ainda não há contas cadastradas. */
  data: ProjecaoDoMes | null;
  refetch: () => void;
} {
  const hoje = hojeEmSaoPaulo();
  const contas = useContas();
  const recorrentes = useRecorrentes();
  const movimentos = useMovimentosDoMes(mesDe(hoje));
  const faturas = useFaturasResumo();
  const cartoes = useCartoes();

  const data = useMemo(() => {
    if (!contas.data || !recorrentes.data || !movimentos.data || !faturas.data || !cartoes.data) return null;
    if (contas.data.length === 0) return null;
    const nome = new Map(cartoes.data.map((c) => [c.id, c.nome]));
    return projetarFimDoMes({
      hoje,
      saldoHoje: contas.data.reduce((s, c) => s + c.saldo, 0),
      recorrentes: recorrentes.data.filter((r) => r.contaId !== null),
      lancadasNoMes: new Set(movimentos.data.map((m) => m.recorrenteId).filter((id): id is string => Boolean(id))),
      faturas: faturas.data
        .filter((f) => !f.pagaEm)
        .map((f) => ({ id: f.id, descricao: `Fatura ${nome.get(f.cartaoId) ?? ""}`.trim(), vencimento: f.vencimento, total: f.total })),
      agendados: movimentos.data.filter((m) => m.data > hoje).map((m) => ({ data: m.data, descricao: m.descricao, valor: m.valor })),
    });
  }, [contas.data, recorrentes.data, movimentos.data, faturas.data, cartoes.data, hoje]);

  return {
    isPending: contas.isPending || recorrentes.isPending || movimentos.isPending || faturas.isPending || cartoes.isPending,
    isError: contas.isError || recorrentes.isError || movimentos.isError || faturas.isError || cartoes.isError,
    data,
    refetch: () => {
      void contas.refetch();
      void recorrentes.refetch();
      void movimentos.refetch();
      void faturas.refetch();
    },
  };
}
