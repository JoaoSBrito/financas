import {
  dataNoMes,
  faturaDaCompra,
  formatar,
  guardadoNoPeriodo,
  mesDe,
  partesDoMes,
  rendimentoNoPeriodo,
  sugestaoSemanal,
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
