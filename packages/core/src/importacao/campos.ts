import { criarData, type Data } from "../datas";
import type { Centavos } from "../dinheiro";

/** Caixa alta, sem acentos e com espaços simples: base para comparar descrições. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Data do extrato em "AAAA-MM-DD". Aceita "dd/mm/aaaa", "dd/mm/aa", "dd-mm-aaaa",
 * "dd.mm.aaaa" e "aaaa-mm-dd" (com ou sem hora). Datas fora do calendário viram null.
 */
export function lerDataFlexivel(texto: string): Data | null {
  const t = texto.trim();
  let ano: number;
  let mes: number;
  let dia: number;
  const br = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(t);
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(t);
  if (br) {
    dia = Number(br[1]);
    mes = Number(br[2]);
    ano = Number(br[3]);
    if (br[3]!.length === 2) ano += 2000;
  } else if (iso) {
    ano = Number(iso[1]);
    mes = Number(iso[2]);
    dia = Number(iso[3]);
  } else return null;
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const data = criarData(ano, mes, dia);
  // criarData "rola" datas impossíveis (31/02 vira 03/03): confere se nada mudou.
  return data === `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}` ? data : null;
}

/**
 * Valor do extrato em centavos. Aceita "R$ 1.234,56", "-1.234,56", "1234.56",
 * "1,234.56", "(12,00)" e o sinal no fim ("12,00-"). Sem algarismos: null.
 */
export function lerValorFlexivel(texto: string): Centavos | null {
  const t = texto.trim();
  if (!/\d/.test(t)) return null;
  const negativo = /^\(.*\)$/.test(t) || /-/.test(t);
  const s = t.replace(/[^\d.,]/g, "");
  const ultimaVirgula = s.lastIndexOf(",");
  const ultimoPonto = s.lastIndexOf(".");

  let decimal: "," | "." | null;
  if (ultimaVirgula >= 0 && ultimoPonto >= 0) decimal = ultimaVirgula > ultimoPonto ? "," : ".";
  else {
    const sep = ultimaVirgula >= 0 ? "," : ultimoPonto >= 0 ? "." : null;
    if (!sep) decimal = null;
    else {
      const vezes = s.split(sep).length - 1;
      const depois = s.length - s.lastIndexOf(sep) - 1;
      // "1.234" e "1.234.567" são milhar; "12,5" e "12,50" são decimais.
      decimal = vezes > 1 || depois === 3 ? null : sep;
    }
  }

  let inteiro = s;
  let fracao = "";
  if (decimal) {
    const i = s.lastIndexOf(decimal);
    inteiro = s.slice(0, i);
    fracao = s.slice(i + 1);
  }
  inteiro = inteiro.replace(/[.,]/g, "") || "0";
  // Três casas para arredondar a segunda (ex.: "0,125" vira 13 centavos).
  const tres = (fracao.replace(/\D/g, "") + "000").slice(0, 3);
  const centavos = Number(inteiro) * 100 + Math.round(Number(tres) / 10);
  if (!Number.isFinite(centavos)) return null;
  return negativo ? -centavos : centavos;
}

export interface ParcelaReconhecida {
  numero: number;
  total: number;
}

const valida = (numero: number, total: number): ParcelaReconhecida | null =>
  total >= 2 && total <= 48 && numero >= 1 && numero <= total ? { numero, total } : null;

/**
 * Parcela "3 de 10" a partir da coluna de parcela (quando existe) ou do fim da descrição
 * ("LOJA X 03/10", "LOJA X PARC 3/10", "LOJA X PARCELA 3 DE 10").
 * Devolve também a descrição sem o trecho da parcela.
 */
export function reconhecerParcela(
  descricao: string,
  colunaParcela?: string | null,
): { parcela: ParcelaReconhecida | null; descricaoSemParcela: string } {
  const limpa = descricao.replace(/\s+/g, " ").trim();
  const coluna = colunaParcela?.trim();
  if (coluna) {
    const m = /^(?:parc(?:ela)?\.?\s*)?(\d{1,2})\s*(?:\/|de|of)\s*(\d{1,2})$/i.exec(coluna);
    const p = m ? valida(Number(m[1]), Number(m[2])) : null;
    if (p) return { parcela: p, descricaoSemParcela: semSufixo(limpa) ?? limpa };
  }
  const m = /(?:^|\s)(?:-\s*)?(?:parc(?:ela)?\.?\s*)?(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})$/i.exec(limpa);
  const p = m ? valida(Number(m[1]), Number(m[2])) : null;
  if (!p || !m) return { parcela: null, descricaoSemParcela: limpa };
  return { parcela: p, descricaoSemParcela: limpa.slice(0, m.index).replace(/[\s-]+$/, "").trim() || limpa };
}

/** Descrição sem o sufixo de parcela, quando a parcela veio de outra coluna. */
function semSufixo(descricao: string): string | null {
  const m = /(?:^|\s)(?:-\s*)?(?:parc(?:ela)?\.?\s*)?(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})$/i.exec(descricao);
  return m && valida(Number(m[1]), Number(m[2])) ? descricao.slice(0, m.index).replace(/[\s-]+$/, "").trim() || null : null;
}

export type TipoDaLinha = "gasto" | "credito" | "pagamento";

/**
 * Gasto (positivo), crédito/estorno (negativo) ou pagamento da fatura
 * (negativo com "pagamento" na descrição), que fica fora da importação.
 */
export function classificarLinha(descricao: string, valor: Centavos): TipoDaLinha {
  if (valor >= 0) return "gasto";
  return /\b(PAGAMENTO|PAGTO|PGTO|PAG FATURA)\b/.test(normalizarTexto(descricao)) ? "pagamento" : "credito";
}
