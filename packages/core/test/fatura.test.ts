import { describe, expect, it } from "vitest";
import {
  calcularFechamento,
  cicloDaFatura,
  faturaDaCompra,
  gerarCiclos,
  melhorDiaDeCompra,
  planejarRealocacao,
  type Cartao,
} from "../src";

// Cartão XP: vence dia 10, fecha 5 dias úteis antes (hipótese a confirmar).
const xp: Cartao = {
  id: "xp",
  diaVencimento: 10,
  vencimentoNaoUtil: "proximo_dia_util",
  fechamento: { tipo: "dias_antes", dias: 5, contagem: "uteis" },
};

describe("cicloDaFatura com dias úteis", () => {
  it("novembro/2026: fecha 03/nov e vence 10/nov", () => {
    expect(cicloDaFatura(xp, "2026-11")).toMatchObject({
      fechamento: "2026-11-03",
      vencimento: "2026-11-10",
      status: "estimado",
    });
  });

  it("dezembro/2026: fecha 03/dez", () => {
    expect(cicloDaFatura(xp, "2026-12").fechamento).toBe("2026-12-03");
  });

  it("janeiro/2027: dia 10 é domingo, vence 11/jan e fecha 04/jan", () => {
    expect(cicloDaFatura(xp, "2027-01")).toMatchObject({
      fechamento: "2027-01-04",
      vencimento: "2027-01-11",
    });
  });

  it("fevereiro/2027: Carnaval no meio, fecha 01/fev", () => {
    expect(cicloDaFatura(xp, "2027-02").fechamento).toBe("2027-02-01");
  });

  it("data confirmada pelo usuário prevalece sobre a regra", () => {
    const ciclo = cicloDaFatura(xp, "2026-12", [{ mes: "2026-12", fechamento: "2026-12-02" }]);
    expect(ciclo).toMatchObject({ fechamento: "2026-12-02", status: "confirmado" });
  });
});

describe("outras regras de fechamento", () => {
  it("dias corridos variam com o tamanho do mês", () => {
    const cartao: Cartao = { ...xp, fechamento: { tipo: "dias_antes", dias: 10, contagem: "corridos" } };
    expect(cicloDaFatura(cartao, "2026-11").fechamento).toBe("2026-10-31");
    expect(cicloDaFatura(cartao, "2027-03").fechamento).toBe("2027-02-28");
  });

  it("dia fixo depois do vencimento cai no mês anterior", () => {
    const cartao: Cartao = {
      id: "c",
      diaVencimento: 5,
      vencimentoNaoUtil: "mantem",
      fechamento: { tipo: "dia_fixo", dia: 28 },
    };
    expect(cicloDaFatura(cartao, "2026-12").fechamento).toBe("2026-11-28");
  });
});

describe("faturaDaCompra", () => {
  it("compra antes do fechamento entra na fatura do mês", () => {
    expect(faturaDaCompra(xp, "2026-11-01").mes).toBe("2026-11");
  });

  it("compra no dia do fechamento entra na fatura que fecha", () => {
    expect(faturaDaCompra(xp, "2026-11-03").mes).toBe("2026-11");
  });

  it("compra no dia seguinte ao fechamento vai para a próxima", () => {
    expect(faturaDaCompra(xp, "2026-11-04").mes).toBe("2026-12");
  });

  it("compra no fim do mês vai para a fatura seguinte", () => {
    expect(faturaDaCompra(xp, "2026-11-25").mes).toBe("2026-12");
  });

  it("melhor dia de compra em 01/nov é 04/nov", () => {
    expect(melhorDiaDeCompra(xp, "2026-11-01")).toBe("2026-11-04");
  });
});

describe("calcularFechamento", () => {
  it("é a função pura da regra, sem datas confirmadas", () => {
    expect(calcularFechamento(xp, "2027-02")).toBe("2027-02-01");
  });
});

describe("gerarCiclos", () => {
  it("gera as faturas futuras como estimadas", () => {
    const ciclos = gerarCiclos(xp, "2026-11", 4, [{ mes: "2026-11", fechamento: "2026-11-03" }]);
    expect(ciclos.map((c) => c.fechamento)).toEqual(["2026-11-03", "2026-12-03", "2027-01-04", "2027-02-01"]);
    expect(ciclos.map((c) => c.status)).toEqual(["confirmado", "estimado", "estimado", "estimado"]);
  });
});

describe("planejarRealocacao", () => {
  const compras = [
    { id: "a", dataCompra: "2026-12-01", primeiraFatura: "2026-12" },
    { id: "b", dataCompra: "2026-12-03", primeiraFatura: "2026-12" },
    { id: "c", dataCompra: "2026-11-20", primeiraFatura: "2026-12" },
  ];

  it("antecipar o fechamento de dezembro para 02/12 só move a compra do dia 03", () => {
    const r = planejarRealocacao(xp, [{ mes: "2026-12", fechamento: "2026-12-02" }], compras);
    expect(r).toEqual([{ id: "b", de: "2026-12", para: "2027-01", deslocamento: 1 }]);
  });

  it("sem mudança de data, nada é realocado", () => {
    expect(planejarRealocacao(xp, [], compras)).toEqual([]);
  });
});
