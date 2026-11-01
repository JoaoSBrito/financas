import { describe, expect, it } from "vitest";
import { limiteComprometido, parcelamentoEmAndamento, parcelarCompra } from "../src";

describe("parcelamentoEmAndamento", () => {
  const parcelas = parcelamentoEmAndamento({
    valorParcela: 10000,
    totalParcelas: 10,
    parcelaAtual: 6,
    faturaAtual: "2026-11",
  });

  it("parcela 6 em novembro e parcela 10 em março", () => {
    expect(parcelas[5]).toMatchObject({ numero: 6, mes: "2026-11", historico: false });
    expect(parcelas[9]).toMatchObject({ numero: 10, mes: "2027-03" });
  });

  it("parcelas 1 a 5 ficam como histórico", () => {
    expect(parcelas.filter((p) => p.historico).map((p) => p.numero)).toEqual([1, 2, 3, 4, 5]);
    expect(parcelas[0]!.mes).toBe("2026-06");
  });

  it("compromete R$ 500 do limite", () => {
    expect(limiteComprometido(parcelas)).toBe(50000);
  });
});

describe("parcelarCompra", () => {
  it("6x de R$ 1.200 a partir de dezembro", () => {
    const p = parcelarCompra(120000, 6, "2026-12");
    expect(p.map((x) => x.valor)).toEqual([20000, 20000, 20000, 20000, 20000, 20000]);
    expect(p[5]!.mes).toBe("2027-05");
  });

  it("sobra de centavos vai para a primeira parcela", () => {
    expect(parcelarCompra(10000, 3, "2026-12").map((x) => x.valor)).toEqual([3334, 3333, 3333]);
  });
});
