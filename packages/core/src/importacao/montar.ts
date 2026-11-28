import type { Data, Mes } from "../datas";
import type { Centavos } from "../dinheiro";
import { parcelamentoEmAndamento, type Parcela } from "../parcelas";
import type { LinhaConciliada } from "./conciliar";
import type { ParcelaReconhecida } from "./campos";

/**
 * O que fazer com uma linha da revisão:
 * importar como compra, conferir um lançamento que já existe ou ignorar.
 */
export type AcaoDaLinha = "importar" | "conferir" | "ignorar";

/** Escolhas do usuário para uma linha (descrição, categoria e parcela podem ter sido editadas). */
export interface DecisaoDaLinha {
  linha: LinhaConciliada;
  acao: AcaoDaLinha;
  descricao: string;
  categoriaId: string | null;
  /** Parcela corrigida; null = à vista. */
  parcela: ParcelaReconhecida | null;
  /** Em "conferir" com diferença de valor: corrige a parcela do app para o valor do banco. */
  usarValorDoBanco?: boolean;
}

/** Ação inicial de cada estado (a tela parte daqui). */
export function acaoPadrao(l: LinhaConciliada): AcaoDaLinha {
  if (l.estado === "ja_no_app") return "conferir";
  return l.aceitaPorPadrao ? "importar" : "ignorar";
}

export interface CompraImportada {
  idExterno: string;
  descricao: string;
  descricaoOriginal: string;
  categoriaId: string | null;
  dataCompra: Data;
  /** Soma das parcelas (negativa nos créditos). */
  valorTotal: Centavos;
  origem: "importada" | "credito";
  parcelas: Pick<Parcela, "numero" | "mes" | "valor" | "historico">[];
}

export interface ConferenciaImportada {
  lancamentoId: string;
  /** Novo valor da parcela, quando o usuário escolhe usar o valor do banco. */
  novoValor: Centavos | null;
}

export interface Importacao {
  compras: CompraImportada[];
  conferencias: ConferenciaImportada[];
  /** Último mês com parcela (as faturas precisam existir até ele). */
  ultimoMes: Mes;
  /** Para o resumo: quanto entra na fatura de destino. */
  quantidade: number;
  totalNaFatura: Centavos;
}

/**
 * Transforma as decisões da revisão no que será gravado.
 * À vista e crédito: uma parcela na fatura de destino. Parcela nova: a compra inteira
 * em andamento (anteriores como histórico, a atual no destino, as seguintes projetadas).
 */
export function montarImportacao(mesFatura: Mes, decisoes: DecisaoDaLinha[]): Importacao {
  const compras: CompraImportada[] = [];
  const conferencias: ConferenciaImportada[] = [];
  let ultimoMes = mesFatura;
  let totalNaFatura = 0;

  for (const d of decisoes) {
    if (d.acao === "ignorar") continue;
    const l = d.linha;

    if (d.acao === "conferir") {
      if (!l.vinculo) throw new Error(`Linha ${l.linha}: não há lançamento para conferir`);
      const corrigir = Boolean(d.usarValorDoBanco) && l.vinculo.diferenca !== 0 && l.valor > 0;
      conferencias.push({ lancamentoId: l.vinculo.lancamentoId, novoValor: corrigir ? l.valor : null });
      continue;
    }

    const descricao = d.descricao.trim().slice(0, 80) || l.descricao;
    const comum = { idExterno: l.idExterno, descricao, descricaoOriginal: l.descricaoOriginal, categoriaId: d.categoriaId, dataCompra: l.data };

    if (l.valor < 0) {
      compras.push({ ...comum, valorTotal: l.valor, origem: "credito", parcelas: [{ numero: 1, mes: mesFatura, valor: l.valor, historico: false }] });
      totalNaFatura += l.valor;
      continue;
    }

    if (d.parcela) {
      const parcelas = parcelamentoEmAndamento({
        valorParcela: l.valor,
        totalParcelas: d.parcela.total,
        parcelaAtual: d.parcela.numero,
        faturaAtual: mesFatura,
      }).map(({ numero, mes, valor, historico }) => ({ numero, mes, valor, historico }));
      compras.push({ ...comum, valorTotal: l.valor * d.parcela.total, origem: "importada", parcelas });
      const ultima = parcelas.at(-1)!.mes;
      if (ultima > ultimoMes) ultimoMes = ultima;
    } else {
      compras.push({ ...comum, valorTotal: l.valor, origem: "importada", parcelas: [{ numero: 1, mes: mesFatura, valor: l.valor, historico: false }] });
    }
    totalNaFatura += l.valor;
  }

  return { compras, conferencias, ultimoMes, quantidade: compras.length, totalNaFatura };
}
