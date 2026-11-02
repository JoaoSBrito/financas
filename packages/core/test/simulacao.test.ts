import { describe, expect, it } from "vitest";
import { melhorCartaoParaHoje, simularCompra, type Cartao } from "../src";

const xp: Cartao = {
  id: "xp",
  diaVencimento: 10,
  vencimentoNaoUtil: "proximo_dia_util",
  fechamento: { tipo: "dias_antes", dias: 5, contagem: "uteis" },
};
const viagens: Cartao = {
  id: "viagens",
  diaVencimento: 28,
  vencimentoNaoUtil: "proximo_dia_util",
  fechamento: { tipo: "dia_fixo", dia: 20 },
};

describe("simularCompra", () => {
  it("6x de R$ 1.200 no XP em 04/nov começa em dezembro", () => {
    const s = simularCompra({
      cartao: xp,
      confirmadas: [],
      dataCompra: "2026-11-04",
      valor: 120000,
      parcelas: 6,
      totaisPorMes: new Map([["2026-12", 130000]]),
      limite: 800000,
      comprometido: 258000,
      hoje: "2026-11-04",
    });
    expect(s.ciclo.mes).toBe("2026-12");
    expect(s.parcelas[0]!.valor).toBe(20000);
    expect(s.primeiraFaturaDepois).toBe(150000);
    expect(s.limiteDisponivelDepois).toBe(422000);
    expect(s.ultimoMes).toBe("2027-05");
    expect(s.historicas).toBe(0);
  });

  it("compra antiga em 10x: parcelas de faturas vencidas viram histórico", () => {
    // Compra em 15/06: entra na fatura de julho. Hoje é 01/11.
    const s = simularCompra({
      cartao: xp,
      confirmadas: [],
      dataCompra: "2026-06-15",
      valor: 100000,
      parcelas: 10,
      totaisPorMes: new Map([["2026-11", 184250]]),
      limite: 800000,
      comprometido: 184250,
      hoje: "2026-11-01",
    });
    expect(s.ciclo.mes).toBe("2026-07");
    expect(s.historicas).toBe(4);
    expect(s.primeiraAtiva).toMatchObject({ numero: 5, mes: "2026-11" });
    expect(s.primeiraFaturaDepois).toBe(194250);
    // Só as 6 parcelas restantes prendem o limite.
    expect(s.limiteDisponivelDepois).toBe(800000 - 184250 - 60000);
  });

  it("compra à vista numa fatura já vencida fica só como histórico", () => {
    const s = simularCompra({
      cartao: xp,
      confirmadas: [],
      dataCompra: "2026-08-20",
      valor: 5000,
      parcelas: 1,
      totaisPorMes: new Map(),
      limite: 800000,
      comprometido: 0,
      hoje: "2026-11-01",
    });
    expect(s.primeiraAtiva).toBeNull();
    expect(s.primeiraFaturaDepois).toBeNull();
    expect(s.limiteDisponivelDepois).toBe(800000);
  });
});

describe("melhorCartaoParaHoje", () => {
  it("em 01/nov o Viagens paga em 28/nov e o XP em 10/nov", () => {
    expect(
      melhorCartaoParaHoje(
        [
          { cartao: xp, confirmadas: [] },
          { cartao: viagens, confirmadas: [] },
        ],
        "2026-11-01",
      ),
    ).toEqual({ cartaoId: "viagens", vencimento: "2026-11-30" });
  });

  it("logo depois do fechamento do XP, ele vira o melhor", () => {
    expect(
      melhorCartaoParaHoje(
        [
          { cartao: xp, confirmadas: [] },
          { cartao: viagens, confirmadas: [] },
        ],
        "2026-11-04",
      )?.cartaoId,
    ).toBe("xp");
  });

  it("sem cartões, devolve null", () => {
    expect(melhorCartaoParaHoje([], "2026-11-01")).toBeNull();
  });
});
