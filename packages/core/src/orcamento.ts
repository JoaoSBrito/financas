import type { Mes } from "./datas";
import type { Centavos } from "./dinheiro";

export interface ParcelaCategorizada {
  mes: Mes;
  valor: Centavos;
  categoriaId: string | null;
  historico: boolean;
}

/**
 * Gasto por categoria num mês. Cada parcela conta no mês da fatura em que cai;
 * parcelas históricas e lançamentos sem categoria ficam de fora.
 */
export function gastoPorCategoria(parcelas: ParcelaCategorizada[], mes: Mes): Map<string, Centavos> {
  const mapa = new Map<string, Centavos>();
  for (const p of parcelas) {
    if (p.historico || p.mes !== mes || p.categoriaId === null) continue;
    mapa.set(p.categoriaId, (mapa.get(p.categoriaId) ?? 0) + p.valor);
  }
  return mapa;
}

export type NivelOrcamento = "normal" | "atencao" | "estourado";

/** Alerta em 80% (atenção) e 100% (estourado). */
export function situacaoDoOrcamento(gasto: Centavos, orcamento: Centavos): {
  percentual: number;
  nivel: NivelOrcamento;
} {
  if (orcamento <= 0) return { percentual: 0, nivel: "normal" };
  // Compara em inteiros para que 79,75% não vire 80% por arredondamento.
  const nivel: NivelOrcamento =
    gasto * 100 >= orcamento * 100 ? "estourado" : gasto * 100 >= orcamento * 80 ? "atencao" : "normal";
  const percentual = Math.floor((gasto * 100) / orcamento);
  return { percentual, nivel };
}
