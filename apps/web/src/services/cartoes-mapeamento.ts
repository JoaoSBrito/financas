/**
 * Conversões puras entre as linhas do Supabase e os tipos do domínio.
 * Sem acesso a rede: tudo aqui é testável isoladamente.
 */
import { z } from "zod";
import {
  gerarCiclos,
  mesDe,
  somarMeses,
  type Cartao,
  type CartaoForm,
  type Ciclo,
  type FaturaConfirmada,
  type Mes,
} from "@financas/core";

// ───────────── Cartão ─────────────

export const cartaoLinhaSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  final: z.string().nullable(),
  limite: z.number().int(),
  dia_vencimento: z.number().int(),
  vencimento_nao_util: z.enum(["proximo_dia_util", "mantem"]),
  fechamento_tipo: z.enum(["dia_fixo", "dias_antes", "manual"]),
  fechamento_dia: z.number().int().nullable(),
  fechamento_dias: z.number().int().nullable(),
  fechamento_contagem: z.enum(["uteis", "corridos"]).nullable(),
  avisar_antes_do_fechamento: z.boolean(),
  pedir_confirmacao_mensal: z.boolean(),
});
export type CartaoLinha = z.infer<typeof cartaoLinhaSchema>;

export const COLUNAS_CARTAO =
  "id, nome, final, limite, dia_vencimento, vencimento_nao_util, fechamento_tipo, fechamento_dia, fechamento_dias, fechamento_contagem, avisar_antes_do_fechamento, pedir_confirmacao_mensal";

/** Cartão completo, como as telas usam. */
export interface CartaoCompleto extends Cartao {
  nome: string;
  final: string | null;
  limite: number;
  avisarAntesDoFechamento: boolean;
  pedirConfirmacaoMensal: boolean;
}

export function linhaParaCartao(linha: CartaoLinha): CartaoCompleto {
  const fechamento: Cartao["fechamento"] =
    linha.fechamento_tipo === "dia_fixo"
      ? { tipo: "dia_fixo", dia: linha.fechamento_dia ?? 1 }
      : linha.fechamento_tipo === "dias_antes"
        ? { tipo: "dias_antes", dias: linha.fechamento_dias ?? 7, contagem: linha.fechamento_contagem ?? "corridos" }
        : { tipo: "manual" };
  return {
    id: linha.id,
    nome: linha.nome,
    final: linha.final,
    limite: linha.limite,
    diaVencimento: linha.dia_vencimento,
    vencimentoNaoUtil: linha.vencimento_nao_util,
    fechamento,
    avisarAntesDoFechamento: linha.avisar_antes_do_fechamento,
    pedirConfirmacaoMensal: linha.pedir_confirmacao_mensal,
  };
}

export function cartaoParaFormulario(c: CartaoCompleto): CartaoForm {
  return {
    nome: c.nome,
    final: c.final ?? undefined,
    limite: c.limite,
    diaVencimento: c.diaVencimento,
    vencimentoNaoUtil: c.vencimentoNaoUtil,
    fechamento: c.fechamento,
    avisarAntesDoFechamento: c.avisarAntesDoFechamento,
    pedirConfirmacaoMensal: c.pedirConfirmacaoMensal,
  };
}

/** Formulário → colunas da tabela (sem id e sem user_id, que o banco preenche). */
export function formularioParaLinha(f: CartaoForm): Omit<CartaoLinha, "id"> {
  const r = f.fechamento;
  return {
    nome: f.nome,
    final: f.final ?? null,
    limite: f.limite,
    dia_vencimento: f.diaVencimento,
    vencimento_nao_util: f.vencimentoNaoUtil,
    fechamento_tipo: r.tipo,
    fechamento_dia: r.tipo === "dia_fixo" ? r.dia : null,
    fechamento_dias: r.tipo === "dias_antes" ? r.dias : null,
    fechamento_contagem: r.tipo === "dias_antes" ? r.contagem : null,
    avisar_antes_do_fechamento: f.avisarAntesDoFechamento,
    pedir_confirmacao_mensal: f.pedirConfirmacaoMensal,
  };
}

// ───────────── Fatura ─────────────

export const faturaLinhaSchema = z.object({
  id: z.uuid(),
  cartao_id: z.uuid(),
  mes: z.string(), // "AAAA-MM-01"
  fechamento: z.string(),
  vencimento: z.string(),
  status: z.enum(["estimada", "confirmada"]),
  paga_em: z.string().nullable(),
});
export type FaturaLinha = z.infer<typeof faturaLinhaSchema>;

export const COLUNAS_FATURA = "id, cartao_id, mes, fechamento, vencimento, status, paga_em";

export interface Fatura {
  id: string;
  cartaoId: string;
  mes: Mes;
  fechamento: string;
  vencimento: string;
  status: "estimado" | "confirmado";
  pagaEm: string | null;
}

export function linhaParaFatura(l: FaturaLinha): Fatura {
  return {
    id: l.id,
    cartaoId: l.cartao_id,
    mes: mesDe(l.mes),
    fechamento: l.fechamento,
    vencimento: l.vencimento,
    status: l.status === "confirmada" ? "confirmado" : "estimado",
    pagaEm: l.paga_em,
  };
}

export function confirmadasDe(faturas: Fatura[]): FaturaConfirmada[] {
  return faturas
    .filter((f) => f.status === "confirmado")
    .map((f) => ({ mes: f.mes, fechamento: f.fechamento, vencimento: f.vencimento }));
}

/** Quantos meses de faturas manter geradas à frente. */
export const HORIZONTE_MESES = 12;

export interface PlanoSincronizacao {
  ciclos: Ciclo[];
  /** Faturas estimadas a criar ou atualizar (as confirmadas nunca são tocadas). */
  gravar: { cartao_id: string; mes: string; fechamento: string; vencimento: string; status: "estimada" }[];
}

/**
 * Decide quais faturas estimadas precisam ser criadas ou ter as datas atualizadas
 * para seguir a regra atual do cartão.
 */
export function planejarSincronizacao(params: {
  cartao: Cartao;
  existentes: Fatura[];
  hoje: string;
  /** Último mês que alguma parcela usa (as faturas precisam existir até lá + 1). */
  ultimoMesUsado?: Mes;
}): PlanoSincronizacao {
  const { cartao, existentes, hoje } = params;
  const inicio = mesDe(hoje);
  let fim = somarMeses(inicio, HORIZONTE_MESES - 1);
  if (params.ultimoMesUsado && somarMeses(params.ultimoMesUsado, 1) > fim) fim = somarMeses(params.ultimoMesUsado, 1);
  const quantidade = mesesEntre(inicio, fim) + 1;

  const porMes = new Map(existentes.map((f) => [f.mes, f]));
  const ciclos = gerarCiclos(cartao, inicio, quantidade, confirmadasDe(existentes));

  const gravar = ciclos
    .filter((c) => {
      const atual = porMes.get(c.mes);
      if (atual?.status === "confirmado") return false;
      return !atual || atual.fechamento !== c.fechamento || atual.vencimento !== c.vencimento;
    })
    .map((c) => ({
      cartao_id: cartao.id,
      mes: `${c.mes}-01`,
      fechamento: c.fechamento,
      vencimento: c.vencimento,
      status: "estimada" as const,
    }));

  return { ciclos, gravar };
}

function mesesEntre(de: Mes, ate: Mes): number {
  const [a1, m1] = de.split("-").map(Number);
  const [a2, m2] = ate.split("-").map(Number);
  return (a2! - a1!) * 12 + (m2! - m1!);
}

// ───────────── Fatura com totais (view faturas_resumo) ─────────────

export const faturaResumoLinhaSchema = faturaLinhaSchema.extend({
  total: z.number().int(),
  lancamentos: z.number().int(),
  conferidos: z.number().int(),
});

export interface FaturaResumo extends Fatura {
  total: number;
  lancamentos: number;
  conferidos: number;
}

export function linhaParaFaturaResumo(l: z.infer<typeof faturaResumoLinhaSchema>): FaturaResumo {
  return { ...linhaParaFatura(l), total: l.total, lancamentos: l.lancamentos, conferidos: l.conferidos };
}

/** Totais por mês e quanto do limite está preso (faturas ainda não pagas). */
export function resumirFaturas(faturas: FaturaResumo[]): { totaisPorMes: Map<Mes, number>; comprometido: number } {
  return {
    totaisPorMes: new Map(faturas.map((f) => [f.mes, f.total])),
    comprometido: faturas.filter((f) => !f.pagaEm).reduce((s, f) => s + f.total, 0),
  };
}
