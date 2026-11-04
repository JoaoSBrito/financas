"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { calcularCustoDeVida, hojeEmSaoPaulo, mesDe, somarMeses, type CustoDeVida } from "@financas/core";
import { listarSaidasPorMes } from "@/services/contas";
import { useRecorrentes } from "./useContas";
import { useFaturasResumo } from "./useGastos";

const MESES = 3;

/**
 * Custo de vida para a reserva de emergência: média dos últimos meses completos
 * de faturas (pelo mês da fatura) + saídas da conta. Transferências ficam de fora.
 */
export function useCustoDeVida(): { isPending: boolean; isError: boolean; data: CustoDeVida | null } {
  const hoje = hojeEmSaoPaulo();
  const atual = mesDe(hoje);
  const de = somarMeses(atual, -MESES);
  const ate = somarMeses(atual, -1);
  const faturas = useFaturasResumo();
  const recorrentes = useRecorrentes();
  // Prefixo "movimentos": atualiza junto quando a conta muda.
  const saidas = useQuery({ queryKey: ["movimentos", "saidas", de, ate], queryFn: () => listarSaidasPorMes(de, ate) });

  const data = useMemo(() => {
    if (!faturas.data || !recorrentes.data || !saidas.data) return null;
    const faturasPorMes = new Map<string, number>();
    for (const f of faturas.data) faturasPorMes.set(f.mes, (faturasPorMes.get(f.mes) ?? 0) + f.total);
    return calcularCustoDeVida({
      hoje,
      faturasPorMes,
      saidasPorMes: saidas.data,
      contasFixas: recorrentes.data.filter((r) => r.contaId && r.tipo === "saida").reduce((s, r) => s + r.valor, 0),
      meses: MESES,
    });
  }, [faturas.data, recorrentes.data, saidas.data, hoje]);

  return {
    isPending: faturas.isPending || recorrentes.isPending || saidas.isPending,
    isError: faturas.isError || recorrentes.isError || saidas.isError,
    data,
  };
}
