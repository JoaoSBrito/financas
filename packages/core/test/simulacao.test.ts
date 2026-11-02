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
    });
    expect(s.ciclo.mes).toBe("2026-12");
    expect(s.parcelas[0]!.valor).toBe(20000);
    expect(s.primeiraFaturaDepois).toBe(150000);
    expect(s.limiteDisponivelDepois).toBe(422000);
    expect(s.ultimoMes).toBe("2027-05");
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
