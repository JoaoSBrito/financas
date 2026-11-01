/**
 * Datas sem fuso horário, sempre no formato "AAAA-MM-DD".
 * Trabalhar com strings evita os erros clássicos de fuso do objeto Date.
 */
export type Data = string;
/** Mês de referência de uma fatura, no formato "AAAA-MM". */
export type Mes = string;

function toUTC(d: Data): Date {
  const [a, m, dia] = d.split("-").map(Number);
  return new Date(Date.UTC(a!, m! - 1, dia!));
}

function fromUTC(dt: Date): Data {
  return dt.toISOString().slice(0, 10);
}

export function criarData(ano: number, mes: number, dia: number): Data {
  return fromUTC(new Date(Date.UTC(ano, mes - 1, dia)));
}

export function somarDias(d: Data, dias: number): Data {
  const dt = toUTC(d);
  dt.setUTCDate(dt.getUTCDate() + dias);
  return fromUTC(dt);
}

/** 0 = domingo, 6 = sábado. */
export function diaDaSemana(d: Data): number {
  return toUTC(d).getUTCDay();
}

export function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Cria a data limitando o dia ao fim do mês (ex.: dia 31 em fevereiro vira 28/29). */
export function dataNoMes(ano: number, mes: number, dia: number): Data {
  return criarData(ano, mes, Math.min(dia, ultimoDiaDoMes(ano, mes)));
}

export function mesDe(d: Data): Mes {
  return d.slice(0, 7);
}

export function partesDoMes(m: Mes): { ano: number; mes: number } {
  const [ano, mes] = m.split("-").map(Number);
  return { ano: ano!, mes: mes! };
}

export function somarMeses(m: Mes, n: number): Mes {
  const { ano, mes } = partesDoMes(m);
  const total = ano * 12 + (mes - 1) + n;
  const a = Math.floor(total / 12);
  const mm = (total % 12) + 1;
  return `${a}-${String(mm).padStart(2, "0")}`;
}

/** "2026-11-03" → "03/11/2026" */
export function formatarData(d: Data): string {
  const [a, m, dia] = d.split("-");
  return `${dia}/${m}/${a}`;
}

/** "2026-11-03" → "03/11" */
export function formatarDiaMes(d: Data): string {
  const [, m, dia] = d.split("-");
  return `${dia}/${m}`;
}

const NOMES_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "2026-11" → "novembro de 2026" */
export function nomeDoMes(m: Mes, comAno = true): string {
  const { ano, mes } = partesDoMes(m);
  const nome = NOMES_MESES[mes - 1]!;
  return comAno ? `${nome} de ${ano}` : nome;
}

/** Data de hoje no fuso de São Paulo, no formato "AAAA-MM-DD". */
export function hojeEmSaoPaulo(agora: Date = new Date()): Data {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}
