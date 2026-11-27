import { paleta, semantica } from "@financas/ui/tokens";
import { nomeDoMes, type Mes, type SituacaoFatura } from "@financas/core";


/** "2026-11" → "nov"; em outro ano → "jan/27". */
export function mesCurto(mes: Mes, anoReferencia?: number): string {
  const curto = nomeDoMes(mes, false).slice(0, 3);
  const ano = Number(mes.slice(0, 4));
  return anoReferencia === undefined || ano === anoReferencia ? curto : `${curto}/${String(ano).slice(2)}`;
}

export const SITUACAO: Record<SituacaoFatura, { rotulo: string; cor: string; fundo: string }> = {
  // O rótulo escrito é o indicador; a cor só reforça.
  aberta: { rotulo: "Aberta", cor: paleta.texto, fundo: paleta.elevado },
  futura: { rotulo: "Futura", cor: paleta.textoSecundario, fundo: paleta.elevado },
  fechada: { rotulo: "Fechada", cor: semantica.atencao.texto, fundo: semantica.atencao.fundo },
  vencida: { rotulo: "Vencida", cor: semantica.estouro.texto, fundo: semantica.estouro.fundo },
  paga: { rotulo: "Paga", cor: semantica.receita.texto, fundo: semantica.receita.fundo },
};
