import type { Data, Mes } from "./datas";
import type { Centavos } from "./dinheiro";
import { faturaDaCompra, type Cartao, type Ciclo, type FaturaConfirmada } from "./fatura";
import { parcelarCompra, type Parcela } from "./parcelas";

export interface SimulacaoDeCompra {
  /** Fatura que recebe a primeira parcela. */
  ciclo: Ciclo;
  parcelas: Parcela[];
  /** Total da fatura da primeira parcela depois da compra. */
  primeiraFaturaDepois: Centavos;
  limiteDisponivelDepois: Centavos;
  ultimoMes: Mes;
}

/** Impacto de uma compra antes de salvar: onde cai, quanto fica cada fatura e o limite. */
export function simularCompra(p: {
  cartao: Cartao;
  confirmadas: FaturaConfirmada[];
  dataCompra: Data;
  valor: Centavos;
  parcelas: number;
  /** Total atual de cada fatura do cartão, por mês. */
  totaisPorMes: Map<Mes, Centavos>;
  limite: Centavos;
  comprometido: Centavos;
}): SimulacaoDeCompra {
  const ciclo = faturaDaCompra(p.cartao, p.dataCompra, p.confirmadas);
  const parcelas = parcelarCompra(p.valor, p.parcelas, ciclo.mes);
  return {
    ciclo,
    parcelas,
    primeiraFaturaDepois: (p.totaisPorMes.get(ciclo.mes) ?? 0) + parcelas[0]!.valor,
    limiteDisponivelDepois: p.limite - p.comprometido - p.valor,
    ultimoMes: parcelas.at(-1)!.mes,
  };
}

/**
 * Melhor cartão para comprar hoje: o que dá mais prazo até o vencimento
 * da fatura em que a compra entraria. Empate: o primeiro da lista.
 */
export function melhorCartaoParaHoje(
  opcoes: { cartao: Cartao; confirmadas: FaturaConfirmada[] }[],
  hoje: Data,
): { cartaoId: string; vencimento: Data } | null {
  let melhor: { cartaoId: string; vencimento: Data } | null = null;
  for (const o of opcoes) {
    const { vencimento } = faturaDaCompra(o.cartao, hoje, o.confirmadas);
    if (!melhor || vencimento > melhor.vencimento) melhor = { cartaoId: o.cartao.id, vencimento };
  }
  return melhor;
}
