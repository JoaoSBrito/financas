import { criarData, diaDaSemana, somarDias, type Data } from "./datas";

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function pascoa(ano: number): Data {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return criarData(ano, mes, dia);
}

/**
 * Dias sem expediente bancário nacional: feriados nacionais
 * mais Carnaval (segunda e terça) e Corpus Christi.
 * Feriados estaduais e municipais ficam de fora.
 */
export function feriadosBancarios(ano: number): Set<Data> {
  const p = pascoa(ano);
  const fixos: [number, number][] = [
    [1, 1], [4, 21], [5, 1], [9, 7], [10, 12], [11, 2], [11, 15], [11, 20], [12, 25],
  ];
  const datas = fixos.map(([m, d]) => criarData(ano, m, d));
  datas.push(
    somarDias(p, -48), // segunda de Carnaval
    somarDias(p, -47), // terça de Carnaval
    somarDias(p, -2), // Sexta-feira Santa
    somarDias(p, 60), // Corpus Christi
  );
  return new Set(datas);
}

const cache = new Map<number, Set<Data>>();

export function ehDiaUtil(d: Data): boolean {
  const dow = diaDaSemana(d);
  if (dow === 0 || dow === 6) return false;
  const ano = Number(d.slice(0, 4));
  if (!cache.has(ano)) cache.set(ano, feriadosBancarios(ano));
  return !cache.get(ano)!.has(d);
}

export function proximoDiaUtil(d: Data): Data {
  let atual = d;
  while (!ehDiaUtil(atual)) atual = somarDias(atual, 1);
  return atual;
}

/** Volta N dias úteis a partir de uma data (a própria data não conta). */
export function voltarDiasUteis(d: Data, n: number): Data {
  let atual = d;
  let contados = 0;
  while (contados < n) {
    atual = somarDias(atual, -1);
    if (ehDiaUtil(atual)) contados++;
  }
  return atual;
}
