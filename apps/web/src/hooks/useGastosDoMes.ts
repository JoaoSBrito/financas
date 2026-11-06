"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { mesDaParcela, mesDe, resumirGastos, somarMeses, type BaseDosGastos, type Data, type Mes } from "@financas/core";
import { listarSaidasEntre, type MovimentoConta } from "@/services/contas";
import { listarLancamentosEntre, type Lancamento } from "@/services/faturas";

export interface GastoDetalhado {
  chave: string;
  origem: "cartao" | "conta";
  mes: Mes;
  data: Data | null;
  descricao: string;
  valor: number;
  categoriaId: string | null;
  lancamento?: Lancamento;
  movimento?: MovimentoConta;
}

/**
 * Gastos de um mês (com o anterior para comparar): parcelas do cartão + saídas da conta.
 * Fica de fora: saldo inicial da fatura, parcelas históricas e transferências.
 */
export function useGastosDoMes(mes: Mes, base: BaseDosGastos) {
  const anterior = somarMeses(mes, -1);
  // Uma parcela "pela compra" pode estar numa fatura até 2 meses depois do mês dela.
  const cartao = useQuery({
    queryKey: ["lancamentos", "gastos", anterior, somarMeses(mes, 2)],
    queryFn: () => listarLancamentosEntre(anterior, somarMeses(mes, 2)),
  });
  const conta = useQuery({
    queryKey: ["movimentos", "gastos", anterior, mes],
    queryFn: () => listarSaidasEntre(anterior, mes),
  });

  const itens = useMemo<GastoDetalhado[] | null>(() => {
    if (!cartao.data || !conta.data) return null;
    const doCartao = cartao.data
      .filter((l) => l.origem !== "saldo_inicial")
      .map((l) => ({
        chave: `c-${l.id}`,
        origem: "cartao" as const,
        mes: mesDaParcela(base, { mesFatura: l.mes, dataCompra: l.dataCompra, numero: l.numero }),
        data: l.dataCompra,
        descricao: l.descricao,
        valor: l.valor,
        categoriaId: l.categoriaId,
        lancamento: l,
      }));
    const daConta = conta.data.map((m) => ({
      chave: `m-${m.id}`,
      origem: "conta" as const,
      mes: mesDe(m.data),
      data: m.data,
      descricao: m.descricao,
      valor: -m.valor,
      categoriaId: m.categoriaId,
      movimento: m,
    }));
    return [...doCartao, ...daConta].filter((i) => i.mes === mes || i.mes === anterior);
  }, [cartao.data, conta.data, base, mes, anterior]);

  const resumo = useMemo(() => (itens ? resumirGastos(itens, mes) : null), [itens, mes]);

  return {
    isPending: cartao.isPending || conta.isPending,
    isError: cartao.isError || conta.isError,
    refetch: () => {
      void cartao.refetch();
      void conta.refetch();
    },
    resumo,
    itensDoMes: (itens ?? [])
      .filter((i) => i.mes === mes)
      .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? "") || b.valor - a.valor),
  };
}
