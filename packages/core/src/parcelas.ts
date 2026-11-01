import { somarMeses, type Mes } from "./datas";
import { dividirEmParcelas, type Centavos } from "./dinheiro";

export interface Parcela {
  numero: number;
  total: number;
  mes: Mes;
  valor: Centavos;
  /** Parcela já paga antes de a compra ser cadastrada no app. */
  historico: boolean;
}

/** Compra nova: divide o total e começa na fatura informada. */
export function parcelarCompra(total: Centavos, n: number, primeiraFatura: Mes): Parcela[] {
  return dividirEmParcelas(total, n).map((valor, i) => ({
    numero: i + 1,
    total: n,
    mes: somarMeses(primeiraFatura, i),
    valor,
    historico: false,
  }));
}

/**
 * Parcelamento em andamento: "10x de R$ 100, a parcela 6 vem na fatura de novembro".
 * As parcelas anteriores à atual entram como histórico (fora de orçamento e limite).
 */
export function parcelamentoEmAndamento(params: {
  valorParcela: Centavos;
  totalParcelas: number;
  parcelaAtual: number;
  faturaAtual: Mes;
}): Parcela[] {
  const { valorParcela, totalParcelas, parcelaAtual, faturaAtual } = params;
  if (parcelaAtual < 1 || parcelaAtual > totalParcelas) {
    throw new Error("A parcela atual precisa estar entre 1 e o total de parcelas");
  }
  return Array.from({ length: totalParcelas }, (_, i) => {
    const numero = i + 1;
    return {
      numero,
      total: totalParcelas,
      mes: somarMeses(faturaAtual, numero - parcelaAtual),
      valor: valorParcela,
      historico: numero < parcelaAtual,
    };
  });
}

/** Quanto do limite as parcelas ainda prendem (tudo que não é histórico nem já pago). */
export function limiteComprometido(parcelas: Parcela[], pagasAte?: Mes): Centavos {
  return parcelas
    .filter((p) => !p.historico && (pagasAte === undefined || p.mes > pagasAte))
    .reduce((soma, p) => soma + p.valor, 0);
}
