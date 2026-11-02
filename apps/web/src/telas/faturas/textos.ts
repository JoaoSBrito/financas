import { nomeDoMes, type Mes, type SituacaoFatura } from "@financas/core";

export const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** "2026-11" → "nov"; em outro ano → "jan/27". */
export function mesCurto(mes: Mes, anoReferencia?: number): string {
  const curto = nomeDoMes(mes, false).slice(0, 3);
  const ano = Number(mes.slice(0, 4));
  return anoReferencia === undefined || ano === anoReferencia ? curto : `${curto}/${String(ano).slice(2)}`;
}

export const SITUACAO: Record<SituacaoFatura, { rotulo: string; cor: string; fundo: string }> = {
  aberta: { rotulo: "Aberta", cor: "#312E81", fundo: "#EEF2FF" },
  futura: { rotulo: "Futura", cor: "#4B5563", fundo: "#F3F4F6" },
  fechada: { rotulo: "Fechada", cor: "#92400E", fundo: "#FEF3C7" },
  vencida: { rotulo: "Vencida", cor: "#991B1B", fundo: "#FEE2E2" },
  paga: { rotulo: "Paga", cor: "#0F3D3A", fundo: "#CCFBF1" },
};
