import { describe, expect, it } from "vitest";
import { dividirFatura, parcelamentosAtivos, situacaoDaFatura, type LancamentoResumo } from "../src";

const l = (p: Partial<LancamentoResumo>): LancamentoResumo => ({
  compraId: "x",
  descricao: "X",
  numero: 1,
  totalParcelas: 1,
  valor: 1000,
  origem: "app",
  mes: "2026-11",
  conferida: false,
  ...p,
});

describe("dividirFatura", () => {
  it("separa à vista, parcelas e assinaturas", () => {
    const d = dividirFatura([
      l({ valor: 18640, conferida: true }),
      l({ compraId: "nb", valor: 10000, numero: 6, totalParcelas: 10 }),
      l({ compraId: "st", valor: 4490, origem: "recorrente", conferida: true }),
      l({ compraId: "si", valor: 64000, origem: "saldo_inicial" }),
    ]);
    expect(d).toEqual({ total: 97130, aVista: 82640, parcelas: 10000, assinaturas: 4490, quantidade: 4, conferidos: 2 });
  });
});

describe("parcelamentosAtivos", () => {
  const notebook = [6, 7, 8, 9, 10].map((n, i) =>
    l({ compraId: "nb", descricao: "Notebook", numero: n, totalParcelas: 10, valor: 10000, mes: ["2026-11", "2026-12", "2027-01", "2027-02", "2027-03"][i]! }),
  );
  const geladeira = [5, 6].map((n, i) =>
    l({ compraId: "gl", descricao: "Geladeira", numero: n, totalParcelas: 6, valor: 22000, mes: ["2026-11", "2026-12"][i]! }),
  );

  it("mostra a parcela atual, o fim e quanto falta", () => {
    expect(parcelamentosAtivos([...notebook, ...geladeira, l({})], "2026-11")).toEqual([
      { compraId: "gl", descricao: "Geladeira", atual: 5, total: 6, valorParcela: 22000, ultimoMes: "2026-12", restante: 44000 },
      { compraId: "nb", descricao: "Notebook", atual: 6, total: 10, valorParcela: 10000, ultimoMes: "2027-03", restante: 50000 },
    ]);
  });

  it("a partir de dezembro, o notebook está na parcela 7", () => {
    expect(parcelamentosAtivos(notebook, "2026-12")[0]).toMatchObject({ atual: 7, restante: 40000 });
  });
});

describe("situacaoDaFatura", () => {
  const f = (mes: string, vencimento: string, pagaEm: string | null = null) => ({ mes, vencimento, pagaEm });
  it("classifica em relação a hoje", () => {
    expect(situacaoDaFatura(f("2026-11", "2026-11-10"), "2026-11-05", "2026-12")).toBe("fechada");
    expect(situacaoDaFatura(f("2026-11", "2026-11-10"), "2026-11-12", "2026-12")).toBe("vencida");
    expect(situacaoDaFatura(f("2026-11", "2026-11-10", "2026-11-09"), "2026-11-12", "2026-12")).toBe("paga");
    expect(situacaoDaFatura(f("2026-12", "2026-12-10"), "2026-11-05", "2026-12")).toBe("aberta");
    expect(situacaoDaFatura(f("2027-01", "2027-01-11"), "2026-11-05", "2026-12")).toBe("futura");
  });
});
