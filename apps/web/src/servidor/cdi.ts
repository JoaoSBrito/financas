/**
 * Rendimento estimado das caixinhas pelo CDI (usado só no servidor, pela tarefa diária).
 * Fonte: série 12 do SGS do Banco Central (taxa DI diária, em % ao dia).
 */
import { z } from "zod";
import { estimarRendimento, type Data, type TaxaCdiDiaria } from "@financas/core";

const paraBr = (d: Data) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

export function urlSerieCdi(de: Data, ate: Data): string {
  return `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${paraBr(de)}&dataFinal=${paraBr(ate)}`;
}

const linhaBcb = z.object({
  data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  valor: z.string(),
});

/** Converte a resposta do BCB ({ data: "01/11/2026", valor: "0.055131" }) em taxas diárias. */
export function interpretarSerieCdi(json: unknown): TaxaCdiDiaria[] {
  return linhaBcb
    .array()
    .parse(json)
    .map((l) => {
      const [d, m, a] = l.data.split("/");
      return { data: `${a}-${m}-${d}`, taxaDia: Number(l.valor.replace(",", ".")) };
    })
    .filter((t) => Number.isFinite(t.taxaDia))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export interface CaixinhaParaRender {
  id: string;
  userId: string;
  saldo: number;
  percentualCdi: number | null;
  calculadoAte: Data | null;
}

export interface LancamentoRendimento {
  caixinhaId: string;
  userId: string;
  valor: number;
  /** Último dia com taxa aplicada: vira a data do lançamento e o novo "calculado até". */
  ate: Data;
}

/** Para cada caixinha com % do CDI, aplica as taxas publicadas depois do último cálculo. */
export function planejarRendimentos(caixinhas: CaixinhaParaRender[], taxas: TaxaCdiDiaria[], hoje: Data): {
  lancamentos: LancamentoRendimento[];
  /** Caixinhas que nunca foram calculadas: só marcam o início (sem rendimento retroativo). */
  iniciar: string[];
} {
  const lancamentos: LancamentoRendimento[] = [];
  const iniciar: string[] = [];
  for (const c of caixinhas) {
    if (c.percentualCdi === null || c.percentualCdi <= 0) continue;
    if (!c.calculadoAte) {
      iniciar.push(c.id);
      continue;
    }
    const novas = taxas.filter((t) => t.data > c.calculadoAte! && t.data <= hoje);
    if (novas.length === 0 || c.saldo <= 0) continue;
    const { rendimento } = estimarRendimento(c.saldo, c.percentualCdi, novas);
    lancamentos.push({ caixinhaId: c.id, userId: c.userId, valor: rendimento, ate: novas.at(-1)!.data });
  }
  return { lancamentos, iniciar };
}
