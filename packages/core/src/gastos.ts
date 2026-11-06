import { mesDe, somarMeses, type Data, type Mes } from "./datas";
import type { Centavos } from "./dinheiro";

/** Como as parcelas do cartão entram nos meses da tela de Gastos. */
export type BaseDosGastos = "compra" | "fatura";

/**
 * Mês em que uma parcela do cartão conta como gasto.
 * - "compra": a parcela N conta no mês da compra + (N − 1). Sem data de compra
 *   (parcelamento lançado como "em andamento"), usa o mês da fatura.
 * - "fatura": o mês da fatura em que a parcela cai.
 */
export function mesDaParcela(base: BaseDosGastos, p: { mesFatura: Mes; dataCompra: Data | null; numero: number }): Mes {
  if (base === "fatura" || !p.dataCompra) return p.mesFatura;
  return somarMeses(mesDe(p.dataCompra), p.numero - 1);
}

export interface ItemDeGasto {
  mes: Mes;
  valor: Centavos;
  categoriaId: string | null;
}

export interface LinhaDeCategoria {
  /** null = "Sem categoria". */
  categoriaId: string | null;
  total: Centavos;
  /** Fração do total do mês (0 a 1). */
  participacao: number;
  /** Total da mesma categoria no mês anterior. */
  anterior: Centavos;
  /** Variação em relação ao mês anterior (0,18 = +18%); null quando não havia gasto antes. */
  variacao: number | null;
}

/** Gastos de um mês por categoria, do maior para o menor, comparando com o mês anterior. */
export function resumirGastos(itens: ItemDeGasto[], mes: Mes): { total: Centavos; totalAnterior: Centavos; linhas: LinhaDeCategoria[] } {
  const anteriorMes = somarMeses(mes, -1);
  const atual = new Map<string | null, Centavos>();
  const anterior = new Map<string | null, Centavos>();
  for (const i of itens) {
    if (i.mes === mes) atual.set(i.categoriaId, (atual.get(i.categoriaId) ?? 0) + i.valor);
    else if (i.mes === anteriorMes) anterior.set(i.categoriaId, (anterior.get(i.categoriaId) ?? 0) + i.valor);
  }
  const total = [...atual.values()].reduce((s, v) => s + v, 0);
  const totalAnterior = [...anterior.values()].reduce((s, v) => s + v, 0);
  const linhas = [...atual.entries()]
    .filter(([, v]) => v > 0)
    .map(([categoriaId, valor]) => {
      const antes = anterior.get(categoriaId) ?? 0;
      return {
        categoriaId,
        total: valor,
        participacao: total ? valor / total : 0,
        anterior: antes,
        variacao: antes > 0 ? (valor - antes) / antes : null,
      };
    })
    // "Sem categoria" sempre por último; as demais do maior para o menor.
    .sort((a, b) => Number(a.categoriaId === null) - Number(b.categoriaId === null) || b.total - a.total);
  return { total, totalAnterior, linhas };
}
