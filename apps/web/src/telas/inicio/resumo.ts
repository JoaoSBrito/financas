/**
 * Cálculos da tela Início a partir dos cartões e das faturas (puros e testáveis).
 */
import {
  faturaDaCompra,
  mesDe,
  somarDias,
  somarMeses,
  type Data,
  type Mes,
} from "@financas/core";
import { confirmadasDe, type CartaoCompleto, type FaturaResumo } from "@/services/cartoes-mapeamento";

export interface ResumoInicio {
  /** Soma das faturas abertas de todos os cartões. */
  faturaAtual: number;
  limiteTotal: number;
  /** Tudo que ainda não foi pago (fatura aberta + fechadas + futuras). */
  comprometido: number;
  limiteDisponivel: number;
  /** Parcelas e assinaturas em faturas depois da aberta. */
  comprometidoFuturo: number;
  ultimoMesComprometido: Mes | null;
  /** Fechamento mais próximo entre as faturas abertas. */
  proximoFechamento: { cartao: string; data: Data; dias: number } | null;
  /** Mês de referência do orçamento: fatura aberta do primeiro cartão. */
  mesOrcamento: Mes;
  /** Totais por mês somando os cartões, a partir do mês da fatura aberta mais antiga. */
  proximasFaturas: { mes: Mes; total: number; aberta: boolean }[];
  agenda: { data: Data; tipo: "fechamento" | "vencimento"; cartao: string; valor?: number; status: "estimado" | "confirmado" }[];
}

function diasEntre(de: Data, ate: Data): number {
  return Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86_400_000);
}

export function resumirInicio(cartoes: CartaoCompleto[], faturas: FaturaResumo[], hoje: Data, meses = 4): ResumoInicio {
  let faturaAtual = 0;
  let limiteTotal = 0;
  let comprometido = 0;
  let comprometidoFuturo = 0;
  let ultimoMesComprometido: Mes | null = null;
  let proximoFechamento: ResumoInicio["proximoFechamento"] = null;
  const abertos: Mes[] = [];
  const agenda: ResumoInicio["agenda"] = [];
  const mesHoje = mesDe(hoje);

  for (const c of cartoes) {
    const doCartao = faturas.filter((f) => f.cartaoId === c.id);
    const aberta = faturaDaCompra(c, hoje, confirmadasDe(doCartao));
    abertos.push(aberta.mes);
    limiteTotal += c.limite;

    for (const f of doCartao) {
      if (!f.pagaEm) comprometido += f.total;
      if (f.mes === aberta.mes) faturaAtual += f.total;
      if (f.mes > aberta.mes && f.total > 0) {
        comprometidoFuturo += f.total;
        if (!ultimoMesComprometido || f.mes > ultimoMesComprometido) ultimoMesComprometido = f.mes;
      }
      if (mesDe(f.fechamento) === mesHoje) {
        agenda.push({ data: f.fechamento, tipo: "fechamento", cartao: c.nome, status: f.status });
      }
      if (mesDe(f.vencimento) === mesHoje) {
        agenda.push({ data: f.vencimento, tipo: "vencimento", cartao: c.nome, valor: f.total, status: f.status });
      }
    }

    const dias = diasEntre(hoje, aberta.fechamento);
    if (!proximoFechamento || aberta.fechamento < proximoFechamento.data) {
      proximoFechamento = { cartao: c.nome, data: aberta.fechamento, dias };
    }
  }

  const inicio = [...abertos].sort()[0] ?? mesHoje;
  const proximasFaturas = Array.from({ length: meses }, (_, i) => {
    const mes = somarMeses(inicio, i);
    return {
      mes,
      total: faturas.filter((f) => f.mes === mes).reduce((s, f) => s + f.total, 0),
      aberta: abertos.includes(mes),
    };
  });

  agenda.sort((a, b) => a.data.localeCompare(b.data) || a.tipo.localeCompare(b.tipo));

  return {
    faturaAtual,
    limiteTotal,
    comprometido,
    limiteDisponivel: limiteTotal - comprometido,
    comprometidoFuturo,
    ultimoMesComprometido,
    proximoFechamento,
    mesOrcamento: abertos[0] ?? mesHoje,
    proximasFaturas,
    agenda,
  };
}

/** Dia seguinte ao fechamento mais próximo: o melhor dia para compras grandes. */
export function melhorDiaDeCompraGeral(r: ResumoInicio): Data | null {
  return r.proximoFechamento ? somarDias(r.proximoFechamento.data, 1) : null;
}
