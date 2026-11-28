/**
 * Leitura do arquivo CSV da fatura, sem depender do navegador:
 * encoding (UTF-8 ou Latin-1), separador e células (com aspas).
 */

export type Separador = ";" | "," | "\t";
export type Encoding = "utf-8" | "latin1";

/** Linha do arquivo com o número em que começa (1 = primeira linha). */
export interface LinhaCsv {
  linha: number;
  celulas: string[];
}

/**
 * Decodifica os bytes do arquivo. Tenta UTF-8 e, se houver byte inválido,
 * usa Latin-1 (Windows-1252), comum em exportações de bancos.
 */
export function decodificarArquivo(bytes: Uint8Array): { texto: string; encoding: Encoding } {
  let texto: string;
  let encoding: Encoding;
  try {
    texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    encoding = "utf-8";
  } catch {
    texto = new TextDecoder("windows-1252").decode(bytes);
    encoding = "latin1";
  }
  return { texto: texto.replace(/^\uFEFF/, ""), encoding };
}

/** Quantas vezes o caractere aparece fora de aspas. */
function contarForaDeAspas(linha: string, c: string): number {
  let n = 0;
  let aspas = false;
  for (const ch of linha) {
    if (ch === '"') aspas = !aspas;
    else if (ch === c && !aspas) n++;
  }
  return n;
}

/** Separador mais frequente na primeira linha com conteúdo (empate ou nenhum: ponto e vírgula). */
export function detectarSeparador(texto: string): Separador {
  const primeira = texto.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const candidatos: Separador[] = [";", ",", "\t"];
  let melhor: Separador = ";";
  let maior = 0;
  for (const c of candidatos) {
    const n = contarForaDeAspas(primeira, c);
    if (n > maior) {
      maior = n;
      melhor = c;
    }
  }
  return melhor;
}

/**
 * Divide o texto em linhas e células. Aceita aspas (com "" para aspas literais),
 * quebras de linha dentro de aspas, CRLF e LF. Linhas vazias são descartadas.
 */
export function lerCsv(texto: string, separador: Separador): LinhaCsv[] {
  const linhas: LinhaCsv[] = [];
  let celulas: string[] = [];
  let atual = "";
  let aspas = false;
  let numeroFisico = 1;
  let inicioDaLinha = 1;

  const fecharLinha = () => {
    celulas.push(atual);
    if (celulas.some((c) => c.trim() !== "")) linhas.push({ linha: inicioDaLinha, celulas: celulas.map((c) => c.trim()) });
    celulas = [];
    atual = "";
  };

  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]!;
    if (aspas) {
      if (ch === '"') {
        if (texto[i + 1] === '"') {
          atual += '"';
          i++;
        } else aspas = false;
      } else {
        if (ch === "\n") numeroFisico++;
        atual += ch;
      }
      continue;
    }
    if (ch === '"') aspas = true;
    else if (ch === separador) {
      celulas.push(atual);
      atual = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++;
      fecharLinha();
      numeroFisico++;
      inicioDaLinha = numeroFisico;
    } else atual += ch;
  }
  if (atual !== "" || celulas.length > 0) fecharLinha();
  return linhas;
}
