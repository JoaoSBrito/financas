import type { Data } from "./datas";
import type { Centavos } from "./dinheiro";

export interface Movimento {
  data: Data;
  descricao: string;
  /** Positivo entra na conta, negativo sai. */
  valor: Centavos;
  /**
   * "transferencia" mexe no saldo mas NÃO é gasto:
   * pagamento de fatura (o gasto já foi a compra) e depósito em caixinha.
   */
  tipo: "entrada" | "saida" | "transferencia";
}

export interface PontoDoSaldo extends Movimento {
  saldoApos: Centavos;
}

/** Aplica os movimentos em ordem de data e devolve o saldo após cada um. */
export function projetarSaldo(saldoInicial: Centavos, movimentos: Movimento[]): {
  pontos: PontoDoSaldo[];
  saldoFinal: Centavos;
  menorSaldo: Centavos;
} {
  const ordenados = [...movimentos].sort((a, b) => a.data.localeCompare(b.data));
  let saldo = saldoInicial;
  let menor = saldoInicial;
  const pontos = ordenados.map((m) => {
    saldo += m.valor;
    menor = Math.min(menor, saldo);
    return { ...m, saldoApos: saldo };
  });
  return { pontos, saldoFinal: saldo, menorSaldo: menor };
}

/** Soma só os gastos de verdade (ignora transferências). */
export function totalDeGastos(movimentos: Movimento[]): Centavos {
  return movimentos.filter((m) => m.tipo === "saida").reduce((s, m) => s - m.valor, 0);
}

/**
 * Ajuste de saldo: o valor informado do banco prevalece.
 * Devolve o lançamento de ajuste (positivo ou negativo); zero se já bate.
 */
export function calcularAjuste(saldoNoApp: Centavos, saldoReal: Centavos): Centavos {
  return saldoReal - saldoNoApp;
}

/** Saldo projetado = saldo de hoje + entradas previstas − faturas a vencer − contas fixas. */
export function saldoProjetado(p: {
  saldoHoje: Centavos;
  entradasPrevistas: Centavos;
  faturasAVencer: Centavos;
  contasFixas: Centavos;
  /** Depósitos planejados em caixinhas (transferências). */
  transferenciasPlanejadas?: Centavos;
}): Centavos {
  return (
    p.saldoHoje + p.entradasPrevistas - p.faturasAVencer - p.contasFixas - (p.transferenciasPlanejadas ?? 0)
  );
}
