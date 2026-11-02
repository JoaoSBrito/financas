import { describe, expect, it } from "vitest";
import type { CartaoCompleto, FaturaResumo } from "@/services/cartoes-mapeamento";
import { melhorDiaDeCompraGeral, resumirInicio } from "./resumo";

const base = { avisarAntesDoFechamento: true, pedirConfirmacaoMensal: true, final: null, vencimentoNaoUtil: "proximo_dia_util" } as const;
const xp: CartaoCompleto = { ...base, id: "xp", nome: "XP", limite: 800000, diaVencimento: 10, fechamento: { tipo: "dias_antes", dias: 5, contagem: "uteis" } };
const viagens: CartaoCompleto = { ...base, id: "vg", nome: "Viagens", limite: 200000, diaVencimento: 28, fechamento: { tipo: "dia_fixo", dia: 20 } };

const f = (cartaoId: string, mes: string, fechamento: string, vencimento: string, total: number, pagaEm: string | null = null): FaturaResumo => ({
  id: `${cartaoId}-${mes}`, cartaoId, mes, fechamento, vencimento, status: "estimado", pagaEm, total, lancamentos: 0, conferidos: 0,
});

const faturas = [
  f("xp", "2026-10", "2026-10-02", "2026-10-09", 150000, "2026-10-09"),
  f("xp", "2026-11", "2026-11-03", "2026-11-10", 184250),
  f("xp", "2026-12", "2026-12-03", "2026-12-10", 130000),
  f("xp", "2027-01", "2027-01-04", "2027-01-11", 89000),
  f("vg", "2026-11", "2026-11-20", "2026-11-30", 54240),
  f("vg", "2026-12", "2026-12-21", "2026-12-28", 0),
];

describe("resumirInicio em 01/11", () => {
  const r = resumirInicio([xp, viagens], faturas, "2026-11-01");

  it("soma as faturas abertas e calcula o limite real", () => {
    expect(r.faturaAtual).toBe(184250 + 54240);
    expect(r.limiteTotal).toBe(1000000);
    expect(r.comprometido).toBe(184250 + 130000 + 89000 + 54240);
    expect(r.limiteDisponivel).toBe(1000000 - 457490);
  });

  it("separa o que já está comprometido nas próximas faturas", () => {
    expect(r.comprometidoFuturo).toBe(219000);
    expect(r.ultimoMesComprometido).toBe("2027-01");
  });

  it("aponta o fechamento mais próximo e o melhor dia", () => {
    expect(r.proximoFechamento).toEqual({ cartao: "XP", data: "2026-11-03", dias: 2 });
    expect(melhorDiaDeCompraGeral(r)).toBe("2026-11-04");
  });

  it("soma os cartões por mês para o gráfico", () => {
    expect(r.proximasFaturas.slice(0, 3)).toEqual([
      { mes: "2026-11", total: 238490, aberta: true },
      { mes: "2026-12", total: 130000, aberta: false },
      { mes: "2027-01", total: 89000, aberta: false },
    ]);
  });

  it("monta a agenda do mês em ordem", () => {
    expect(r.agenda.map((a) => `${a.data} ${a.tipo} ${a.cartao}`)).toEqual([
      "2026-11-03 fechamento XP",
      "2026-11-10 vencimento XP",
      "2026-11-20 fechamento Viagens",
      "2026-11-30 vencimento Viagens",
    ]);
  });
});
