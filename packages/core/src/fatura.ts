import { dataNoMes, mesDe, partesDoMes, somarDias, somarMeses, type Data, type Mes } from "./datas";
import { proximoDiaUtil, voltarDiasUteis } from "./feriados";

export type RegraFechamento =
  | { tipo: "dia_fixo"; dia: number }
  | { tipo: "dias_antes"; dias: number; contagem: "uteis" | "corridos" }
  /** O usuário informa as datas mês a mês; a estimativa usa 7 dias corridos. */
  | { tipo: "manual" };

export interface Cartao {
  id: string;
  diaVencimento: number;
  /** O que fazer quando o vencimento cai em fim de semana ou feriado. */
  vencimentoNaoUtil: "proximo_dia_util" | "mantem";
  fechamento: RegraFechamento;
}

/** Datas confirmadas pelo usuário para uma fatura específica. */
export interface FaturaConfirmada {
  mes: Mes;
  fechamento: Data;
  vencimento?: Data;
}

export interface Ciclo {
  /** Mês do vencimento: a fatura de "2026-11" vence em novembro. */
  mes: Mes;
  fechamento: Data;
  vencimento: Data;
  status: "estimado" | "confirmado";
}

function vencimentoNominal(cartao: Cartao, mes: Mes): Data {
  const { ano, mes: m } = partesDoMes(mes);
  return dataNoMes(ano, m, cartao.diaVencimento);
}

/**
 * Fechamento estimado pela regra do cartão para a fatura que vence no mês informado.
 * Função pura: não considera datas confirmadas pelo usuário (veja cicloDaFatura).
 */
export function calcularFechamento(cartao: Cartao, mes: Mes): Data {
  const nominal = vencimentoNominal(cartao, mes);
  const regra = cartao.fechamento;
  switch (regra.tipo) {
    case "dia_fixo": {
      // O fechamento é no mês do vencimento se o dia vier antes; senão, no mês anterior.
      const { ano, mes: m } = partesDoMes(regra.dia < cartao.diaVencimento ? mes : somarMeses(mes, -1));
      return dataNoMes(ano, m, regra.dia);
    }
    case "dias_antes":
      return regra.contagem === "uteis"
        ? voltarDiasUteis(nominal, regra.dias)
        : somarDias(nominal, -regra.dias);
    case "manual":
      return somarDias(nominal, -7);
  }
}

/** Calcula fechamento e vencimento da fatura que vence no mês informado. */
export function cicloDaFatura(
  cartao: Cartao,
  mes: Mes,
  confirmadas: FaturaConfirmada[] = [],
): Ciclo {
  const nominal = vencimentoNominal(cartao, mes);
  const vencimentoEstimado =
    cartao.vencimentoNaoUtil === "proximo_dia_util" ? proximoDiaUtil(nominal) : nominal;
  const confirmada = confirmadas.find((c) => c.mes === mes);
  if (confirmada) {
    return {
      mes,
      fechamento: confirmada.fechamento,
      vencimento: confirmada.vencimento ?? vencimentoEstimado,
      status: "confirmado",
    };
  }
  return {
    mes,
    fechamento: calcularFechamento(cartao, mes),
    vencimento: vencimentoEstimado,
    status: "estimado",
  };
}

/**
 * Em qual fatura entra uma compra: a primeira cujo fechamento é igual ou
 * posterior à data da compra. O dia do fechamento pertence à fatura que fecha.
 */
export function faturaDaCompra(
  cartao: Cartao,
  dataCompra: Data,
  confirmadas: FaturaConfirmada[] = [],
): Ciclo {
  // Começa pela fatura que vence no mês da compra e avança até achar a certa.
  let mes = mesDe(dataCompra);
  for (let i = 0; i < 3; i++) {
    const ciclo = cicloDaFatura(cartao, mes, confirmadas);
    if (dataCompra <= ciclo.fechamento) return ciclo;
    mes = somarMeses(mes, 1);
  }
  return cicloDaFatura(cartao, mes, confirmadas);
}

/** Melhor dia de compra: o dia seguinte ao fechamento da fatura atual. */
export function melhorDiaDeCompra(cartao: Cartao, hoje: Data, confirmadas: FaturaConfirmada[] = []): Data {
  return somarDias(faturaDaCompra(cartao, hoje, confirmadas).fechamento, 1);
}

/** Gera os ciclos de várias faturas seguidas (usado para criar as faturas futuras). */
export function gerarCiclos(
  cartao: Cartao,
  mesInicial: Mes,
  quantidade: number,
  confirmadas: FaturaConfirmada[] = [],
): Ciclo[] {
  return Array.from({ length: quantidade }, (_, i) =>
    cicloDaFatura(cartao, somarMeses(mesInicial, i), confirmadas),
  );
}

export interface CompraAlocada {
  id: string;
  dataCompra: Data;
  /** Mês da fatura em que está a primeira parcela hoje. */
  primeiraFatura: Mes;
}

export interface Realocacao {
  id: string;
  de: Mes;
  para: Mes;
  /** Quantos meses as parcelas devem andar (positivo = para frente). */
  deslocamento: number;
}

/**
 * Depois de corrigir a data de uma fatura, devolve só as compras que mudam de fatura.
 * Cada parcela da compra anda o mesmo número de meses.
 */
export function planejarRealocacao(
  cartao: Cartao,
  confirmadas: FaturaConfirmada[],
  compras: CompraAlocada[],
): Realocacao[] {
  return compras.flatMap((c) => {
    const para = faturaDaCompra(cartao, c.dataCompra, confirmadas).mes;
    if (para === c.primeiraFatura) return [];
    return [{ id: c.id, de: c.primeiraFatura, para, deslocamento: diferencaEmMeses(c.primeiraFatura, para) }];
  });
}

function diferencaEmMeses(de: Mes, para: Mes): number {
  const a = partesDoMes(de);
  const b = partesDoMes(para);
  return (b.ano - a.ano) * 12 + (b.mes - a.mes);
}

/** Texto curto da regra, ex.: "Vence dia 10 · fecha 5 dias úteis antes". */
export function descreverRegra(cartao: Pick<Cartao, "diaVencimento" | "fechamento">): string {
  const r = cartao.fechamento;
  const fechamento =
    r.tipo === "dia_fixo"
      ? `fecha dia ${r.dia}`
      : r.tipo === "dias_antes"
        ? `fecha ${r.dias} ${r.dias === 1 ? "dia" : "dias"} ${r.contagem === "uteis" ? (r.dias === 1 ? "útil" : "úteis") : r.dias === 1 ? "corrido" : "corridos"} antes`
        : "fechamento informado mês a mês";
  return `Vence dia ${cartao.diaVencimento} · ${fechamento}`;
}
