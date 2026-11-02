import type { Data, Mes } from "./datas";
import type { Centavos } from "./dinheiro";

export type OrigemCompra = "app" | "anterior_ao_app" | "saldo_inicial" | "importada" | "recorrente";

export interface LancamentoResumo {
  compraId: string;
  descricao: string;
  numero: number;
  totalParcelas: number;
  valor: Centavos;
  origem: OrigemCompra;
  mes: Mes;
  conferida: boolean;
}

export interface DivisaoDaFatura {
  total: Centavos;
  aVista: Centavos;
  parcelas: Centavos;
  assinaturas: Centavos;
  quantidade: number;
  conferidos: number;
}

/** Fatura dividida em à vista, parcelas e assinaturas, com o progresso da conferência. */
export function dividirFatura(lancamentos: LancamentoResumo[]): DivisaoDaFatura {
  const d: DivisaoDaFatura = { total: 0, aVista: 0, parcelas: 0, assinaturas: 0, quantidade: 0, conferidos: 0 };
  for (const l of lancamentos) {
    d.total += l.valor;
    d.quantidade += 1;
    if (l.conferida) d.conferidos += 1;
    if (l.origem === "recorrente") d.assinaturas += l.valor;
    else if (l.totalParcelas > 1) d.parcelas += l.valor;
    else d.aVista += l.valor;
  }
  return d;
}

export interface ParcelamentoAtivo {
  compraId: string;
  descricao: string;
  /** Parcela que cai na fatura aberta (ou a próxima que falta). */
  atual: number;
  total: number;
  valorParcela: Centavos;
  ultimoMes: Mes;
  /** Soma das parcelas que ainda faltam, incluindo a atual. */
  restante: Centavos;
}

/** Compras parceladas que ainda têm parcelas a partir do mês informado. */
export function parcelamentosAtivos(lancamentos: LancamentoResumo[], aPartirDe: Mes): ParcelamentoAtivo[] {
  const porCompra = new Map<string, LancamentoResumo[]>();
  for (const l of lancamentos) {
    if (l.totalParcelas <= 1 || l.mes < aPartirDe) continue;
    porCompra.set(l.compraId, [...(porCompra.get(l.compraId) ?? []), l]);
  }
  return [...porCompra.values()]
    .map((ls) => {
      const ordenadas = [...ls].sort((a, b) => a.numero - b.numero);
      const primeira = ordenadas[0]!;
      return {
        compraId: primeira.compraId,
        descricao: primeira.descricao,
        atual: primeira.numero,
        total: primeira.totalParcelas,
        valorParcela: primeira.valor,
        ultimoMes: ordenadas.at(-1)!.mes,
        restante: ordenadas.reduce((s, l) => s + l.valor, 0),
      };
    })
    .sort((a, b) => a.ultimoMes.localeCompare(b.ultimoMes) || a.descricao.localeCompare(b.descricao));
}

export type SituacaoFatura = "aberta" | "futura" | "fechada" | "vencida" | "paga";

/**
 * Situação de uma fatura em relação a hoje.
 * `mesAberto` é o mês da fatura que recebe compras feitas hoje.
 */
export function situacaoDaFatura(
  f: { mes: Mes; vencimento: Data; pagaEm: Data | null },
  hoje: Data,
  mesAberto: Mes,
): SituacaoFatura {
  if (f.pagaEm) return "paga";
  if (f.mes === mesAberto) return "aberta";
  if (f.mes > mesAberto) return "futura";
  return hoje <= f.vencimento ? "fechada" : "vencida";
}
