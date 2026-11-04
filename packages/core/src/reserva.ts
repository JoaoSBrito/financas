import { mesDe, somarMeses, type Data, type Mes } from "./datas";
import type { Centavos } from "./dinheiro";

export interface CustoDeVida {
  /** Custo mensal estimado (0 quando não há dados). */
  valor: Centavos;
  /** Meses completos usados na média (vazio quando veio das contas fixas). */
  mesesUsados: Mes[];
  fonte: "media" | "contas_fixas" | "sem_dados";
}

/**
 * Custo de vida mensal: média dos últimos meses completos (padrão 3) de
 * faturas do cartão (pelo mês da fatura) + saídas da conta.
 * Transferências (pagamento de fatura, caixinhas, entre contas) ficam de fora por definição:
 * quem chama passa só faturas e saídas.
 * Meses sem nenhum gasto não entram na média (começo de uso do app).
 * Sem nenhum mês com dados, usa as contas fixas cadastradas.
 */
export function calcularCustoDeVida(p: {
  hoje: Data;
  faturasPorMes: Map<Mes, Centavos>;
  saidasPorMes: Map<Mes, Centavos>;
  contasFixas: Centavos;
  meses?: number;
}): CustoDeVida {
  const quantidade = p.meses ?? 3;
  const atual = mesDe(p.hoje);
  const candidatos = Array.from({ length: quantidade }, (_, i) => somarMeses(atual, -(i + 1))).reverse();
  const comDados = candidatos
    .map((mes) => ({ mes, total: (p.faturasPorMes.get(mes) ?? 0) + (p.saidasPorMes.get(mes) ?? 0) }))
    .filter((m) => m.total > 0);

  if (comDados.length > 0) {
    const soma = comDados.reduce((s, m) => s + m.total, 0);
    return { valor: Math.round(soma / comDados.length), mesesUsados: comDados.map((m) => m.mes), fonte: "media" };
  }
  if (p.contasFixas > 0) return { valor: p.contasFixas, mesesUsados: [], fonte: "contas_fixas" };
  return { valor: 0, mesesUsados: [], fonte: "sem_dados" };
}

export interface SituacaoReserva {
  /** Meses × custo de vida (null sem custo de vida). */
  sugerida: Centavos | null;
  /** Quantos meses de custo o saldo cobre, com uma casa decimal (null sem custo). */
  cobertura: number | null;
}

export function situacaoDaReserva(saldo: Centavos, meses: number, custo: Centavos): SituacaoReserva {
  if (custo <= 0) return { sugerida: null, cobertura: null };
  return { sugerida: meses * custo, cobertura: Math.floor((saldo / custo) * 10) / 10 };
}
