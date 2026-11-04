import {
  dataNoMes,
  faturaDaCompra,
  formatar,
  guardadoNoPeriodo,
  mesDe,
  partesDoMes,
  nomeDoMes,
  rendimentoNoPeriodo,
  situacaoDaReserva,
  sugestaoSemanal,
  type CustoDeVida,
  ultimoDiaDoMes,
  type Data,
  type MovimentoCaixinha,
} from "@financas/core";
import { confirmadasDe, type CartaoCompleto, type FaturaResumo } from "@/services/cartoes-mapeamento";
import type { Caixinha } from "@/services/caixinhas";

export function resumirPatrimonio(caixinhas: Caixinha[], movs: MovimentoCaixinha[], hoje: Data) {
  const { ano, mes } = partesDoMes(mesDe(hoje));
  const inicioMes = dataNoMes(ano, mes, 1);
  const fimMes = dataNoMes(ano, mes, ultimoDiaDoMes(ano, mes));
  return {
    total: caixinhas.reduce((s, c) => s + c.saldo, 0),
    rendeuNoMes: rendimentoNoPeriodo(movs, inicioMes, fimMes),
    rendeuNoAno: rendimentoNoPeriodo(movs, `${ano}-01-01`, `${ano}-12-31`),
    guardadoNoMes: guardadoNoPeriodo(movs, inicioMes, fimMes),
  };
}

/**
 * Data-alvo da caixinha: a data da meta ou, se for vinculada a um cartão,
 * o vencimento da fatura aberta desse cartão.
 */
export function alvoDaCaixinha(c: Caixinha, cartoes: CartaoCompleto[], faturas: FaturaResumo[], hoje: Data): Data | null {
  if (c.dataMeta) return c.dataMeta;
  const cartao = cartoes.find((x) => x.id === c.cartaoId);
  if (!cartao) return null;
  const doCartao = faturas.filter((f) => f.cartaoId === cartao.id);
  return faturaDaCompra(cartao, hoje, confirmadasDe(doCartao)).vencimento;
}

export function dicaDaCaixinha(c: Caixinha, cartoes: CartaoCompleto[], faturas: FaturaResumo[], hoje: Data): string | undefined {
  if (!c.meta) return undefined;
  if (c.saldo >= c.meta) return "Meta atingida";
  const alvo = alvoDaCaixinha(c, cartoes, faturas, hoje);
  if (!alvo) return undefined;
  const semanal = sugestaoSemanal(c.meta - c.saldo, hoje, alvo);
  if (!semanal) return undefined;
  return `Guarde ${formatar(semanal)} por semana para ${c.cartaoId && !c.dataMeta ? "cobrir a fatura" : "chegar à meta"}`;
}

export function detalheDaCaixinha(c: Caixinha, cartoes: CartaoCompleto[]): string {
  const partes: string[] = [];
  const cartao = cartoes.find((x) => x.id === c.cartaoId);
  if (cartao) partes.push(`Vinculada ao cartão ${cartao.nome}`);
  partes.push(c.percentualCdi ? `${c.percentualCdi.toLocaleString("pt-BR")}% do CDI` : "Atualização manual");
  return partes.join(" · ");
}

export const SELO_RESERVA = "Reserva de emergência";

/** "Cobre 3,1 de 6 meses de custo de vida" */
export function textoCobertura(cobertura: number, meses: number): string {
  return `Cobre ${cobertura.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} de ${meses} ${meses === 1 ? "mês" : "meses"} de custo de vida`;
}

/** "R$ 4.100,00/mês · média de ago a out" */
export function textoCustoDeVida(custo: CustoDeVida): string {
  if (custo.fonte === "sem_dados") return "Ainda sem gastos para calcular o custo de vida";
  const base = `${formatar(custo.valor)}/mês`;
  if (custo.fonte === "contas_fixas") return `${base} · estimativa pelas contas fixas`;
  const curto = (m: string) => nomeDoMes(m, false).slice(0, 3);
  const [primeiro] = custo.mesesUsados;
  const ultimo = custo.mesesUsados.at(-1)!;
  const n = custo.mesesUsados.length;
  return n === 1 ? `${base} · estimativa com base em ${nomeDoMes(primeiro!, false)}` : `${base} · média de ${curto(primeiro!)} a ${curto(ultimo)}`;
}

/** Como cada caixinha aparece no card: a reserva usa meses × custo de vida no lugar da meta. */
export function apresentarCaixinha(
  c: Caixinha,
  custo: CustoDeVida | null,
  cartoes: CartaoCompleto[],
  faturas: FaturaResumo[],
  hoje: Data,
): { meta: number | null; dataMeta: Data | null; dica?: string; detalhe: string; selo?: string } {
  if (c.reservaMeses) {
    const s = custo ? situacaoDaReserva(c.saldo, c.reservaMeses, custo.valor) : { sugerida: null, cobertura: null };
    return {
      meta: s.sugerida,
      dataMeta: null,
      detalhe: c.percentualCdi ? `${c.percentualCdi.toLocaleString("pt-BR")}% do CDI` : "Atualização manual",
      selo: SELO_RESERVA,
      dica: s.cobertura !== null ? textoCobertura(s.cobertura, c.reservaMeses) : "Lance seus gastos para calcular o custo de vida",
    };
  }
  return {
    meta: c.meta,
    dataMeta: c.dataMeta,
    detalhe: detalheDaCaixinha(c, cartoes),
    dica: dicaDaCaixinha(c, cartoes, faturas, hoje),
  };
}
