import { describe, expect, it } from "vitest";
import { mesDaParcela, resumirGastos } from "../src";

describe("mesDaParcela", () => {
  const p = (numero: number) => ({ mesFatura: "2026-11", dataCompra: "2026-07-20", numero });
  it("pela compra: parcela N no mês da compra + N − 1", () => {
    expect(mesDaParcela("compra", p(1))).toBe("2026-07");
    expect(mesDaParcela("compra", p(10))).toBe("2027-04");
  });
  it("pela fatura: o mês da fatura", () => {
    expect(mesDaParcela("fatura", p(1))).toBe("2026-11");
  });
  it("sem data de compra (em andamento), usa a fatura", () => {
    expect(mesDaParcela("compra", { mesFatura: "2026-11", dataCompra: null, numero: 6 })).toBe("2026-11");
  });
});

describe("resumirGastos", () => {
  const itens = [
    { mes: "2026-11", valor: 50000, categoriaId: "mercado" },
    { mes: "2026-11", valor: 12000, categoriaId: "mercado" },
    { mes: "2026-11", valor: 30000, categoriaId: "lazer" },
    { mes: "2026-11", valor: 8000, categoriaId: null },
    { mes: "2026-10", valor: 52540, categoriaId: "mercado" },
    { mes: "2026-09", valor: 99999, categoriaId: "lazer" },
  ];

  it("soma por categoria, ordena e deixa 'Sem categoria' por último", () => {
    const r = resumirGastos(itens, "2026-11");
    expect(r.total).toBe(100000);
    expect(r.totalAnterior).toBe(52540);
    expect(r.linhas.map((l) => [l.categoriaId, l.total])).toEqual([
      ["mercado", 62000],
      ["lazer", 30000],
      [null, 8000],
    ]);
  });

  it("calcula participação e variação contra o mês anterior", () => {
    const [mercado, lazer] = resumirGastos(itens, "2026-11").linhas;
    expect(mercado!.participacao).toBe(0.62);
    expect(mercado!.variacao).toBeCloseTo(0.18, 2);
    expect(lazer!.variacao).toBeNull();
  });
});
