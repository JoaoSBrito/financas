import type { Data } from "./datas";
import type { Centavos } from "./dinheiro";

/** Taxa DI diária publicada pelo Banco Central (série SGS 12), em % ao dia. */
export interface TaxaCdiDiaria {
  data: Data;
  taxaDia: number;
}

/**
 * Estima o saldo de uma caixinha aplicando o CDI de cada dia útil.
 * Sem percentual (null), a caixinha não rende sozinha: o saldo só muda
 * com depósitos, resgates e atualizações manuais.
 */
export function estimarRendimento(
  saldo: Centavos,
  percentualCdi: number | null,
  taxas: TaxaCdiDiaria[],
): { saldoEstimado: Centavos; rendimento: Centavos } {
  if (percentualCdi === null || percentualCdi <= 0) {
    return { saldoEstimado: saldo, rendimento: 0 };
  }
  const fator = taxas.reduce(
    (f, t) => f * (1 + (t.taxaDia / 100) * (percentualCdi / 100)),
    1,
  );
  const saldoEstimado = Math.round(saldo * fator);
  return { saldoEstimado, rendimento: saldoEstimado - saldo };
}

/**
 * Atualização manual: o valor do banco sempre prevalece.
 * A diferença entre o saldo real e o que o app tinha vira rendimento (ou ajuste).
 */
export { calcularAjuste as ajustarComSaldoReal } from "./saldo";
