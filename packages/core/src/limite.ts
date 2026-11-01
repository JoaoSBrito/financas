import type { Mes } from "./datas";
import type { Centavos } from "./dinheiro";

export interface ParcelaEmAberto {
  mes: Mes;
  valor: Centavos;
  historico: boolean;
  /** A fatura dessa parcela já foi paga. */
  faturaPaga: boolean;
}

/** Tudo que ainda prende o limite: parcelas não históricas de faturas não pagas. */
export function totalComprometido(parcelas: ParcelaEmAberto[]): Centavos {
  return parcelas
    .filter((p) => !p.historico && !p.faturaPaga)
    .reduce((soma, p) => soma + p.valor, 0);
}

/** Limite disponível real = limite total − comprometido (inclui parcelas futuras). */
export function limiteDisponivel(limite: Centavos, parcelas: ParcelaEmAberto[]): Centavos {
  return limite - totalComprometido(parcelas);
}
