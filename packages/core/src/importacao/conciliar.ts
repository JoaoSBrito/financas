import { somarDias, type Data, type Mes } from "../datas";
import type { Centavos } from "../dinheiro";
import type { OrigemCompra } from "../lancamentos";
import type { LinhaDoExtrato } from "./analisar";
import { normalizarTexto } from "./campos";

/** FNV-1a de 64 bits em hexadecimal: curto, estável e sem dependências. */
function fnv1a64(texto: string): string {
  let h = 0xcbf29ce484222325n;
  const primo = 0x100000001b3n;
  for (const byte of new TextEncoder().encode(texto)) {
    h ^= BigInt(byte);
    h = (h * primo) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, "0");
}

/**
 * Identificador da linha para evitar importar duas vezes (vai em compras.id_externo).
 * Mesmo cartão, mesma fatura, mesma linha (e a mesma ocorrência dela no arquivo) = mesmo id.
 */
export function idExterno(cartaoId: string, mesFatura: Mes, l: Pick<LinhaDoExtrato, "data" | "descricaoOriginal" | "valor" | "parcela" | "ocorrencia">): string {
  const p = l.parcela ? `${l.parcela.numero}/${l.parcela.total}` : "-";
  return `imp1:${fnv1a64([cartaoId, mesFatura, l.data, normalizarTexto(l.descricaoOriginal), l.valor, p, l.ocorrencia].join("|"))}`;
}

/** Lançamento que já está na fatura de destino (view lancamentos). */
export interface LancamentoExistente {
  id: string;
  compraId: string;
  numero: number;
  totalParcelas: number;
  valor: Centavos;
  dataCompra: Data | null;
  descricao: string;
  origem: OrigemCompra;
  conferida: boolean;
}

export type EstadoDaLinha =
  /** Gasto à vista que não está no app. */
  | "avista"
  /** Parcela de uma compra que não está no app: cria a compra em andamento. */
  | "parcela_nova"
  /** A fatura já tem esta parcela: não importa, marca como conferida. */
  | "ja_no_app"
  /** Parece um lançamento feito à mão: fica de fora, salvo se vincular ou importar mesmo assim. */
  | "possivel_duplicado"
  /** Entrou numa importação anterior. */
  | "ja_importado"
  /** Estorno ou crédito: abate da fatura. */
  | "credito"
  /** Pagamento da fatura: o pagamento se registra em "Marcar como paga". */
  | "fica_de_fora";

export interface Vinculo {
  lancamentoId: string;
  compraId: string;
  descricao: string;
  numero: number;
  totalParcelas: number;
  valor: Centavos;
  /** Valor do banco menos o valor do app (0 quando batem). */
  diferenca: Centavos;
}

export interface LinhaConciliada extends LinhaDoExtrato {
  idExterno: string;
  estado: EstadoDaLinha;
  /** Sugestão inicial de aceitar (ou, em "ja_no_app", de conferir). */
  aceitaPorPadrao: boolean;
  vinculo: Vinculo | null;
  /** A mesma linha aparece mais de uma vez no arquivo (pode ser legítimo). */
  repetidaNoArquivo: boolean;
  /** Pela data e pelo fechamento estimado, a compra cairia em outra fatura. */
  foraDoCiclo: boolean;
}

/** Diferença aceita entre a parcela do banco e a do app (arredondamentos): R$ 1 ou 5%. */
export function toleranciaDaParcela(valor: Centavos): Centavos {
  return Math.max(100, Math.round(Math.abs(valor) * 0.05));
}

/** Dias de folga para achar um gasto lançado à mão com a mesma data. */
export const FOLGA_DUPLICADO_DIAS = 2;

const dentroDaFolga = (a: Data, b: Data) => a >= somarDias(b, -FOLGA_DUPLICADO_DIAS) && a <= somarDias(b, FOLGA_DUPLICADO_DIAS);

/**
 * Compara as linhas do arquivo com o que já existe na fatura de destino e decide
 * o estado de cada uma. Cada lançamento existente casa com no máximo uma linha.
 */
export function conciliar(p: {
  cartaoId: string;
  mesFatura: Mes;
  linhas: LinhaDoExtrato[];
  /** Lançamentos da fatura de destino. */
  existentes: LancamentoExistente[];
  /** id_externo de compras já importadas neste cartão. */
  idsImportados: ReadonlySet<string>;
  /** Fatura em que a data cairia pela regra do cartão (para o aviso "fora do ciclo"). */
  mesPelaData?: (data: Data) => Mes;
}): LinhaConciliada[] {
  const usados = new Set<string>();
  const contagem = new Map<string, number>();
  for (const l of p.linhas) {
    const chave = [l.data, normalizarTexto(l.descricaoOriginal), l.valor, l.parcela?.numero, l.parcela?.total].join("|");
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }

  const vinculo = (l: LinhaDoExtrato, e: LancamentoExistente): Vinculo => {
    usados.add(e.id);
    return { lancamentoId: e.id, compraId: e.compraId, descricao: e.descricao, numero: e.numero, totalParcelas: e.totalParcelas, valor: e.valor, diferenca: l.valor - e.valor };
  };
  const livres = () => p.existentes.filter((e) => !usados.has(e.id) && e.origem !== "saldo_inicial");

  // Parcelas primeiro (o casamento delas é o mais confiável), valor exato antes do aproximado.
  const ordem = [...p.linhas.keys()].sort((a, b) => Number(Boolean(p.linhas[b]!.parcela)) - Number(Boolean(p.linhas[a]!.parcela)));
  const resultado = new Array<LinhaConciliada>(p.linhas.length);

  for (const i of ordem) {
    const l = p.linhas[i]!;
    const id = idExterno(p.cartaoId, p.mesFatura, l);
    const chave = [l.data, normalizarTexto(l.descricaoOriginal), l.valor, l.parcela?.numero, l.parcela?.total].join("|");
    const base = {
      ...l,
      idExterno: id,
      vinculo: null as Vinculo | null,
      repetidaNoArquivo: (contagem.get(chave) ?? 0) > 1,
      foraDoCiclo: !l.parcela && l.tipo !== "pagamento" && Boolean(p.mesPelaData) && p.mesPelaData!(l.data) !== p.mesFatura,
    };

    if (l.tipo === "pagamento") {
      resultado[i] = { ...base, foraDoCiclo: false, estado: "fica_de_fora", aceitaPorPadrao: false };
      continue;
    }
    if (p.idsImportados.has(id)) {
      resultado[i] = { ...base, estado: "ja_importado", aceitaPorPadrao: false };
      continue;
    }
    if (l.tipo === "credito") {
      resultado[i] = { ...base, estado: "credito", aceitaPorPadrao: true };
      continue;
    }

    if (l.parcela) {
      const { numero, total } = l.parcela;
      const candidatas = livres()
        .filter((e) => e.totalParcelas === total && e.numero === numero && Math.abs(l.valor - e.valor) <= toleranciaDaParcela(l.valor))
        .sort((a, b) => Math.abs(l.valor - a.valor) - Math.abs(l.valor - b.valor) || similaridade(l, b) - similaridade(l, a));
      if (candidatas[0]) {
        resultado[i] = { ...base, estado: "ja_no_app", aceitaPorPadrao: true, vinculo: vinculo(l, candidatas[0]) };
        continue;
      }
      // Mesma compra lançada com outro número de parcela: provável duplicado.
      const outroNumero = livres().find((e) => e.totalParcelas === total && e.valor === l.valor && similaridade(l, e) > 0);
      if (outroNumero) {
        resultado[i] = { ...base, estado: "possivel_duplicado", aceitaPorPadrao: false, vinculo: vinculo(l, outroNumero) };
        continue;
      }
      resultado[i] = { ...base, estado: "parcela_nova", aceitaPorPadrao: true };
      continue;
    }

    const duplicado = livres()
      .filter((e) => e.totalParcelas === 1 && e.valor === l.valor && e.dataCompra !== null && dentroDaFolga(e.dataCompra, l.data))
      .sort((a, b) => similaridade(l, b) - similaridade(l, a))[0];
    if (duplicado) {
      resultado[i] = { ...base, estado: "possivel_duplicado", aceitaPorPadrao: false, vinculo: vinculo(l, duplicado) };
      continue;
    }
    resultado[i] = { ...base, estado: "avista", aceitaPorPadrao: true };
  }
  return resultado;
}

/** Palavras em comum entre as descrições (desempate entre candidatos). */
function similaridade(l: Pick<LinhaDoExtrato, "descricaoOriginal">, e: Pick<LancamentoExistente, "descricao">): number {
  const palavras = (t: string) => new Set(normalizarTexto(t).split(" ").filter((w) => w.length >= 3));
  const a = palavras(l.descricaoOriginal);
  let n = 0;
  for (const w of palavras(e.descricao)) if (a.has(w)) n++;
  return n;
}
