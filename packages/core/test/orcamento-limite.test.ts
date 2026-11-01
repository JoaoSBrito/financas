import { describe, expect, it } from "vitest";
import { gastoPorCategoria, limiteDisponivel, situacaoDoOrcamento, totalComprometido } from "../src";

describe("limite disponível real", () => {
  const parcelas = [
    { mes: "2026-10", valor: 10000, historico: true, faturaPaga: true },
    { mes: "2026-11", valor: 10000, historico: false, faturaPaga: false },
    { mes: "2026-12", valor: 10000, historico: false, faturaPaga: false },
    { mes: "2026-11", valor: 18640, historico: false, faturaPaga: false },
  ];

  it("ignora histórico e faturas pagas", () => {
    expect(totalComprometido(parcelas)).toBe(38640);
  });

  it("limite − comprometido, incluindo parcelas futuras", () => {
    expect(limiteDisponivel(800000, parcelas)).toBe(761360);
  });
});

describe("orçamento por categoria", () => {
  const parcelas = [
    { mes: "2026-11", valor: 10000, categoriaId: "eletronicos", historico: false },
    { mes: "2026-12", valor: 10000, categoriaId: "eletronicos", historico: false },
    { mes: "2026-11", valor: 10000, categoriaId: "eletronicos", historico: true },
    { mes: "2026-11", valor: 64000, categoriaId: null, historico: false },
  ];

  it("cada parcela conta só no mês da sua fatura", () => {
    expect(gastoPorCategoria(parcelas, "2026-11").get("eletronicos")).toBe(10000);
  });

  it("saldo inicial sem categoria fica de fora", () => {
    expect([...gastoPorCategoria(parcelas, "2026-11").keys()]).toEqual(["eletronicos"]);
  });

  it("alerta em 80% e 100%", () => {
    expect(situacaoDoOrcamento(31900, 40000).nivel).toBe("normal");
    expect(situacaoDoOrcamento(32000, 40000).nivel).toBe("atencao");
    expect(situacaoDoOrcamento(40000, 40000).nivel).toBe("estourado");
  });
});
