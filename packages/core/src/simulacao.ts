import { mesDe, type Data, type Mes } from "./datas";
import type { Centavos } from "./dinheiro";
import { faturaDaCompra, type Cartao, type Ciclo, type FaturaConfirmada } from "./fatura";
import { parcelarCompra, type Parcela } from "./parcelas";

export interface SimulacaoDeCompra {
  /** Fatura da primeira parcela da compra (pode estar no passado). */
  ciclo: Ciclo;
  /** Todas as parcelas; as de faturas já vencidas vêm com historico = true. */
  parcelas: Parcela[];
  /** Quantas parcelas caem em faturas que já venceram (ficam só como histórico). */
  historicas: number;
  /** Primeira parcela que ainda entra numa fatura ativa (null se todas são histórico). */
  primeiraAtiva: Parcela | null;
  /** Total da fatura da primeira parcela ativa depois da compra. */
  primeiraFaturaDepois: Centavos | null;
  limiteDisponivelDepois: Centavos;
  ultimoMes: Mes;
}

/**
 * Impacto de uma compra antes de salvar: onde cai, quanto fica cada fatura e o limite.
 *
 * Compras antigas (parcelamento em andamento): parcelas de faturas que venceram
 * antes do mês atual viram histórico. Não entram em fatura, orçamento nem limite.
 */
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
  /** Data de hoje: define a partir de qual fatura as parcelas estão ativas. */
  hoje: Data;
}): SimulacaoDeCompra {
  const ciclo = faturaDaCompra(p.cartao, p.dataCompra, p.confirmadas);
  const mesAtivo = mesDe(p.hoje);
  const parcelas = parcelarCompra(p.valor, p.parcelas, ciclo.mes).map((x) => ({
    ...x,
    historico: x.mes < mesAtivo,
  }));
  const ativas = parcelas.filter((x) => !x.historico);
  const primeiraAtiva = ativas[0] ?? null;
  const valorAtivo = ativas.reduce((s, x) => s + x.valor, 0);

  return {
    ciclo,
    parcelas,
    historicas: parcelas.length - ativas.length,
    primeiraAtiva,
    primeiraFaturaDepois: primeiraAtiva ? (p.totaisPorMes.get(primeiraAtiva.mes) ?? 0) + primeiraAtiva.valor : null,
    limiteDisponivelDepois: p.limite - p.comprometido - valorAtivo,
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
