import type { CartaoForm, RegraFechamento } from "@financas/core";

/** Formulário de um cartão novo. O limite começa em 0 e é validado ao salvar. */
export const CARTAO_NOVO: CartaoForm = {
  nome: "",
  final: undefined,
  limite: 0,
  diaVencimento: 10,
  vencimentoNaoUtil: "proximo_dia_util",
  fechamento: { tipo: "dias_antes", dias: 7, contagem: "corridos" },
  avisarAntesDoFechamento: true,
  pedirConfirmacaoMensal: true,
};

/** Valores usados ao trocar o tipo de regra pela primeira vez. */
export const REGRA_PADRAO: Record<RegraFechamento["tipo"], RegraFechamento> = {
  dia_fixo: { tipo: "dia_fixo", dia: 3 },
  dias_antes: { tipo: "dias_antes", dias: 7, contagem: "corridos" },
  manual: { tipo: "manual" },
};
