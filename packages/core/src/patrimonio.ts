import { dataNoMes, mesDe, partesDoMes, somarMeses, ultimoDiaDoMes, type Data, type Mes } from "./datas";
import type { Centavos } from "./dinheiro";

export type TipoMovimentoCaixinha = "deposito" | "resgate" | "rendimento_estimado" | "ajuste";

export interface MovimentoCaixinha {
  caixinhaId: string;
  data: Data;
  valor: Centavos;
  tipo: TipoMovimentoCaixinha;
}

/** Rendimento = estimativas pelo CDI + ajustes de saldo informados (depósitos e resgates não contam). */
export function rendimentoNoPeriodo(movs: MovimentoCaixinha[], de: Data, ate: Data): Centavos {
  return movs
    .filter((m) => (m.tipo === "rendimento_estimado" || m.tipo === "ajuste") && m.data >= de && m.data <= ate)
    .reduce((s, m) => s + m.valor, 0);
}

/** Guardado líquido no período (depósitos − resgates). */
export function guardadoNoPeriodo(movs: MovimentoCaixinha[], de: Data, ate: Data): Centavos {
  return movs
    .filter((m) => (m.tipo === "deposito" || m.tipo === "resgate") && m.data >= de && m.data <= ate)
    .reduce((s, m) => s + m.valor, 0);
}

/** Patrimônio no fim de cada mês, dos últimos N meses até o mês de hoje. */
export function evolucaoMensal(movs: MovimentoCaixinha[], hoje: Data, meses = 6): { mes: Mes; total: Centavos }[] {
  const atual = mesDe(hoje);
  return Array.from({ length: meses }, (_, i) => {
    const mes = somarMeses(atual, i - meses + 1);
    const { ano, mes: m } = partesDoMes(mes);
    const fim = mes === atual ? hoje : dataNoMes(ano, m, ultimoDiaDoMes(ano, m));
    return { mes, total: movs.filter((x) => x.data <= fim).reduce((s, x) => s + x.valor, 0) };
  });
}

/**
 * Quanto guardar por semana para chegar à meta até a data.
 * Arredonda para cima (centavos) e considera ao menos 1 semana.
 */
export function sugestaoSemanal(falta: Centavos, hoje: Data, ate: Data): Centavos | null {
  if (falta <= 0) return null;
  const dias = Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86_400_000);
  if (dias < 0) return null;
  const semanas = Math.max(1, Math.ceil(dias / 7));
  return Math.ceil(falta / semanas);
}
