/**
 * Cálculos da tela Início a partir dos cartões e das faturas (puros e testáveis).
 */
import {
  faturaDaCompra,
  gastoPorCategoria,
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
  /** Fatura aberta de cada cartão, do fechamento mais próximo ao mais distante. */
  porCartao: { cartaoId: string; nome: string; indice: number; total: number; fechamento: Data; dias: number }[];
  /** Fechamento mais próximo entre as faturas abertas. */
  proximoFechamento: { cartao: string; data: Data; dias: number } | null;
  /** Mês de referência do orçamento: fatura aberta do primeiro cartão. */
  mesOrcamento: Mes;
  /** Totais por mês somando os cartões, a partir do mês da fatura aberta mais antiga. */
  proximasFaturas: { mes: Mes; total: number; aberta: boolean }[];
  /**
   * Próximas datas dos cartões: fechamento e vencimento da fatura aberta e o vencimento
   * de faturas fechadas ainda não pagas (mesmo vencidas). Faturas pagas e datas passadas saem.
   */
  agenda: {
    data: Data;
    tipo: "fechamento" | "vencimento";
    cartao: string;
    valor?: number;
    status: "estimado" | "confirmado";
    /** Vencimento que já passou e a fatura continua sem pagamento. */
    vencida?: boolean;
  }[];
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
  const porCartao: ResumoInicio["porCartao"] = [];
  const mesHoje = mesDe(hoje);

  for (const [indice, c] of cartoes.entries()) {
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
      // Agenda: só faturas não pagas, da aberta para trás (as futuras ainda não têm datas próximas).
      if (!f.pagaEm && f.mes <= aberta.mes) {
        if (f.mes === aberta.mes && f.fechamento >= hoje) {
          agenda.push({ data: f.fechamento, tipo: "fechamento", cartao: c.nome, status: f.status });
        }
        agenda.push({
          data: f.vencimento,
          tipo: "vencimento",
          cartao: c.nome,
          valor: f.total,
          status: f.status,
          vencida: f.vencimento < hoje,
        });
      }
    }

    const dias = diasEntre(hoje, aberta.fechamento);
    porCartao.push({
      cartaoId: c.id,
      nome: c.nome,
      indice,
      total: doCartao.filter((f) => f.mes === aberta.mes).reduce((soma, f) => soma + f.total, 0),
      fechamento: aberta.fechamento,
      dias,
    });
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
  porCartao.sort((a, b) => a.fechamento.localeCompare(b.fechamento) || a.indice - b.indice);

  return {
    faturaAtual,
    limiteTotal,
    comprometido,
    limiteDisponivel: limiteTotal - comprometido,
    comprometidoFuturo,
    ultimoMesComprometido,
    porCartao,
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

/** Mês de referência do orçamento: fatura aberta do primeiro cartão (ou o mês atual). */
export function mesDeOrcamento(cartoes: CartaoCompleto[], faturas: FaturaResumo[], hoje: Data): Mes {
  const primeiro = cartoes[0];
  if (!primeiro) return mesDe(hoje);
  return faturaDaCompra(primeiro, hoje, confirmadasDe(faturas.filter((f) => f.cartaoId === primeiro.id))).mes;
}

/** Gasto por categoria no orçamento: parcelas pelo mês da fatura + saídas da conta pelo mês da data. */
export function gastoDoOrcamento(
  mes: Mes,
  lancamentos: { mes: Mes; valor: number; categoriaId: string | null }[],
  saidas: { data: Data; valor: number; categoriaId: string | null }[],
): Map<string, number> {
  const mapa = gastoPorCategoria(
    lancamentos.map((l) => ({ mes: l.mes, valor: l.valor, categoriaId: l.categoriaId, historico: false })),
    mes,
  );
  for (const s of saidas) {
    if (!s.categoriaId || mesDe(s.data) !== mes) continue;
    mapa.set(s.categoriaId, (mapa.get(s.categoriaId) ?? 0) - s.valor);
  }
  return mapa;
}
