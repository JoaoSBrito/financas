import type { Data } from "../datas";
import type { Centavos } from "../dinheiro";
import {
  classificarLinha,
  lerDataFlexivel,
  lerValorFlexivel,
  normalizarTexto,
  reconhecerParcela,
  type ParcelaReconhecida,
  type TipoDaLinha,
} from "./campos";
import { detectarSeparador, lerCsv, type LinhaCsv, type Separador } from "./csv";

/** Índice (a partir de 0) de cada coluna no arquivo. */
export interface MapeamentoColunas {
  data: number;
  descricao: number;
  valor: number;
  parcela?: number;
  portador?: number;
}

export type FormatoDoExtrato = "xp" | "nubank" | "generico";

const NOMES: Record<keyof MapeamentoColunas, string[]> = {
  data: ["DATA", "DATE", "DATA DA COMPRA", "DATA COMPRA", "DATA LANCAMENTO", "DATA DO LANCAMENTO"],
  descricao: ["DESCRICAO", "ESTABELECIMENTO", "TITLE", "HISTORICO", "LANCAMENTO", "DESCRICAO DO LANCAMENTO"],
  valor: ["VALOR", "AMOUNT", "VALOR (R$)", "VALOR R$", "VALOR EM R$", "VALOR BRL"],
  parcela: ["PARCELA", "PARCELAS", "INSTALLMENT"],
  portador: ["PORTADOR", "TITULAR", "NOME DO PORTADOR"],
};

/** Reconhece as colunas pelo cabeçalho. Sem data, descrição e valor: null (pede mapeamento). */
export function detectarColunas(cabecalho: string[]): { mapeamento: MapeamentoColunas; formato: FormatoDoExtrato } | null {
  const nomes = cabecalho.map(normalizarTexto);
  const achar = (chave: keyof MapeamentoColunas) => {
    const i = nomes.findIndex((n) => NOMES[chave].includes(n));
    return i >= 0 ? i : undefined;
  };
  const data = achar("data");
  const descricao = achar("descricao");
  const valor = achar("valor");
  if (data === undefined || descricao === undefined || valor === undefined) return null;
  const mapeamento: MapeamentoColunas = { data, descricao, valor, parcela: achar("parcela"), portador: achar("portador") };
  const formato: FormatoDoExtrato =
    nomes.includes("ESTABELECIMENTO") && nomes.includes("PORTADOR") ? "xp" : nomes.includes("TITLE") && nomes.includes("AMOUNT") ? "nubank" : "generico";
  return { mapeamento, formato };
}

/** Lançamento lido do arquivo, já interpretado. */
export interface LinhaDoExtrato {
  /** Linha no arquivo (para mensagens). */
  linha: number;
  data: Data;
  descricaoOriginal: string;
  /** Sugestão de descrição: a original sem o trecho da parcela, até 80 caracteres. */
  descricao: string;
  /** Positivo = gasto; negativo = crédito ou pagamento. */
  valor: Centavos;
  tipo: TipoDaLinha;
  parcela: ParcelaReconhecida | null;
  portador: string | null;
  /** 1 na primeira vez que a mesma linha aparece no arquivo, 2 na segunda... */
  ocorrencia: number;
}

export interface ErroDeLinha {
  linha: number;
  motivo: string;
}

export type ResultadoDaAnalise =
  | {
      ok: true;
      formato: FormatoDoExtrato;
      separador: Separador;
      mapeamento: MapeamentoColunas;
      linhas: LinhaDoExtrato[];
      erros: ErroDeLinha[];
      /** O banco exporta gastos como negativos: os sinais foram invertidos. */
      sinalInvertido: boolean;
    }
  | {
      ok: false;
      motivo: "vazio" | "colunas" | "grande";
      mensagem: string;
      /** Primeiras linhas, para o mapeamento manual de colunas. */
      amostra: string[][];
    };

export const LIMITE_DE_LINHAS = 2000;

/** Chave que identifica "a mesma linha" dentro do arquivo (para contar repetições). */
export function chaveDaLinha(l: Pick<LinhaDoExtrato, "data" | "descricaoOriginal" | "valor" | "parcela">): string {
  const p = l.parcela ? `${l.parcela.numero}/${l.parcela.total}` : "-";
  return [l.data, normalizarTexto(l.descricaoOriginal), l.valor, p].join("|");
}

/**
 * Lê o texto do CSV e devolve os lançamentos reconhecidos e as linhas com problema.
 * Com `mapeamento`, usa as colunas informadas; sem, tenta reconhecer pelo cabeçalho.
 */
export function analisarExtrato(
  texto: string,
  opcoes: { mapeamento?: MapeamentoColunas; temCabecalho?: boolean; inverterSinal?: boolean } = {},
): ResultadoDaAnalise {
  const separador = detectarSeparador(texto);
  const linhas = lerCsv(texto, separador);
  const amostra = linhas.slice(0, 5).map((l) => l.celulas);
  if (linhas.length === 0) return { ok: false, motivo: "vazio", mensagem: "O arquivo está vazio.", amostra };
  if (linhas.length > LIMITE_DE_LINHAS + 1) {
    return { ok: false, motivo: "grande", mensagem: `O arquivo tem mais de ${LIMITE_DE_LINHAS} linhas. Exporte uma fatura por vez.`, amostra };
  }

  const detectado = detectarColunas(linhas[0]!.celulas);
  let mapeamento: MapeamentoColunas;
  let formato: FormatoDoExtrato = "generico";
  let corpo: LinhaCsv[];
  if (opcoes.mapeamento) {
    mapeamento = opcoes.mapeamento;
    corpo = (opcoes.temCabecalho ?? Boolean(detectado)) ? linhas.slice(1) : linhas;
  } else if (detectado) {
    ({ mapeamento, formato } = detectado);
    corpo = linhas.slice(1);
  } else {
    return { ok: false, motivo: "colunas", mensagem: "Não reconhecemos as colunas do arquivo. Indique qual é a data, a descrição e o valor.", amostra };
  }

  const erros: ErroDeLinha[] = [];
  const lidas: Omit<LinhaDoExtrato, "tipo" | "ocorrencia">[] = [];
  for (const { linha, celulas } of corpo) {
    const textoData = celulas[mapeamento.data] ?? "";
    const descricaoOriginal = (celulas[mapeamento.descricao] ?? "").replace(/\s+/g, " ").trim();
    const textoValor = celulas[mapeamento.valor] ?? "";
    const data = lerDataFlexivel(textoData);
    const valor = lerValorFlexivel(textoValor);
    if (!data) {
      erros.push({ linha, motivo: textoData ? `data "${textoData}" inválida` : "sem data" });
      continue;
    }
    if (!descricaoOriginal) {
      erros.push({ linha, motivo: "sem descrição" });
      continue;
    }
    if (valor === null) {
      erros.push({ linha, motivo: textoValor ? `valor "${textoValor}" inválido` : "sem valor" });
      continue;
    }
    if (valor === 0) {
      erros.push({ linha, motivo: "valor zero" });
      continue;
    }
    const colunaParcela = mapeamento.parcela !== undefined ? celulas[mapeamento.parcela] : undefined;
    const { parcela, descricaoSemParcela } = reconhecerParcela(descricaoOriginal, colunaParcela);
    const portador = mapeamento.portador !== undefined ? celulas[mapeamento.portador] || null : null;
    lidas.push({ linha, data, descricaoOriginal: descricaoOriginal.slice(0, 200), descricao: descricaoSemParcela.slice(0, 80), valor, parcela, portador });
  }

  // Bancos que exportam gastos como negativos: a maioria negativa indica o sinal invertido.
  const negativos = lidas.filter((l) => l.valor < 0).length;
  const sinalInvertido = opcoes.inverterSinal ?? negativos > lidas.length - negativos;

  const vistas = new Map<string, number>();
  const resultado: LinhaDoExtrato[] = lidas.map((l) => {
    const valor = sinalInvertido ? -l.valor : l.valor;
    const chave = chaveDaLinha({ ...l, valor });
    const ocorrencia = (vistas.get(chave) ?? 0) + 1;
    vistas.set(chave, ocorrencia);
    return { ...l, valor, tipo: classificarLinha(l.descricaoOriginal, valor), ocorrencia };
  });

  return { ok: true, formato, separador, mapeamento, linhas: resultado, erros, sinalInvertido };
}
