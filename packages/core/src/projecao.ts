import { dataNoMes, mesDe, partesDoMes, ultimoDiaDoMes, type Data } from "./datas";
import type { Centavos } from "./dinheiro";
import { projetarSaldo, type Movimento } from "./saldo";

export interface RecorrenteDeConta {
  id: string;
  descricao: string;
  tipo: "entrada" | "saida";
  valor: Centavos;
  dia: number;
}

export interface FaturaAPagar {
  id: string;
  descricao: string;
  vencimento: Data;
  total: Centavos;
}

export interface MovimentoAgendado {
  /** Id do movimento já lançado (para abrir e editar). */
  id?: string;
  data: Data;
  descricao: string;
  /** Positivo entra, negativo sai. */
  valor: Centavos;
}

export type OrigemPrevisao = "recorrente" | "fatura" | "agendado";

export interface ItemProjetado {
  data: Data;
  descricao: string;
  valor: Centavos;
  origem: OrigemPrevisao;
  /** Id da recorrência, da fatura ou do movimento agendado que originou a previsão. */
  referencia?: string;
  saldoApos: Centavos;
}

export interface ProjecaoDoMes {
  ate: Data;
  itens: ItemProjetado[];
  saldoHoje: Centavos;
  entradasPrevistas: Centavos;
  faturasAVencer: Centavos;
  contasFixas: Centavos;
  outros: Centavos;
  saldoFinal: Centavos;
  menorSaldo: Centavos;
}

/**
 * Saldo projetado até o fim do mês:
 * saldo de hoje + entradas previstas − faturas a vencer − contas fixas (± movimentos já agendados).
 *
 * Recorrências que vencem a partir de hoje e ainda não foram lançadas neste mês entram como previsão;
 * as que já passaram são consideradas refletidas no saldo (por lançamento ou ajuste).
 */
export function projetarFimDoMes(p: {
  hoje: Data;
  saldoHoje: Centavos;
  recorrentes: RecorrenteDeConta[];
  /** Recorrências que já têm movimento lançado neste mês. */
  lancadasNoMes: Set<string>;
  /** Faturas ainda não pagas. */
  faturas: FaturaAPagar[];
  agendados: MovimentoAgendado[];
}): ProjecaoDoMes {
  const { ano, mes } = partesDoMes(mesDe(p.hoje));
  const ate = dataNoMes(ano, mes, ultimoDiaDoMes(ano, mes));

  const previstos: (Movimento & { origem: OrigemPrevisao; referencia?: string })[] = [];
  let entradas = 0;
  let fixas = 0;
  let faturas = 0;
  let outros = 0;

  for (const r of p.recorrentes) {
    const data = dataNoMes(ano, mes, r.dia);
    if (data < p.hoje || p.lancadasNoMes.has(r.id)) continue;
    const valor = r.tipo === "entrada" ? r.valor : -r.valor;
    if (r.tipo === "entrada") entradas += r.valor;
    else fixas += r.valor;
    previstos.push({ data, descricao: r.descricao, valor, tipo: r.tipo, origem: "recorrente", referencia: r.id });
  }
  for (const f of p.faturas) {
    if (f.vencimento < p.hoje || f.vencimento > ate || f.total <= 0) continue;
    faturas += f.total;
    previstos.push({ data: f.vencimento, descricao: f.descricao, valor: -f.total, tipo: "transferencia", origem: "fatura", referencia: f.id });
  }
  for (const a of p.agendados) {
    if (a.data <= p.hoje || a.data > ate) continue;
    outros += a.valor;
    previstos.push({
      data: a.data,
      descricao: a.descricao,
      valor: a.valor,
      tipo: a.valor > 0 ? "entrada" : "saida",
      origem: "agendado",
      referencia: a.id,
    });
  }

  // No mesmo dia, entradas primeiro (o salário costuma cair antes das contas).
  previstos.sort((a, b) => a.data.localeCompare(b.data) || b.valor - a.valor);
  const { pontos, saldoFinal, menorSaldo } = projetarSaldo(p.saldoHoje, previstos);
  const itens = pontos.map((x, i) => ({
    data: x.data,
    descricao: x.descricao,
    valor: x.valor,
    origem: previstos[i]!.origem,
    referencia: previstos[i]!.referencia,
    saldoApos: x.saldoApos,
  }));

  return {
    ate,
    itens,
    saldoHoje: p.saldoHoje,
    entradasPrevistas: entradas,
    faturasAVencer: faturas,
    contasFixas: fixas,
    outros,
    saldoFinal,
    menorSaldo,
  };
}
