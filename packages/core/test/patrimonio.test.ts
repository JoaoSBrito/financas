import { describe, expect, it } from "vitest";
import { evolucaoMensal, guardadoNoPeriodo, rendimentoNoPeriodo, sugestaoSemanal, type MovimentoCaixinha } from "../src";

const m = (data: string, valor: number, tipo: MovimentoCaixinha["tipo"]): MovimentoCaixinha => ({ caixinhaId: "x", data, valor, tipo });
const movs = [
  m("2026-06-10", 1200000, "deposito"),
  m("2026-08-05", 50000, "deposito"),
  m("2026-10-31", 9840, "rendimento_estimado"),
  m("2026-11-01", 80000, "deposito"),
  m("2026-11-01", 5390, "rendimento_estimado"),
  m("2026-11-02", -20000, "resgate"),
  m("2026-11-03", 730, "ajuste"),
];

describe("patrimônio", () => {
  it("rendimento conta só CDI estimado e ajustes", () => {
    expect(rendimentoNoPeriodo(movs, "2026-11-01", "2026-11-30")).toBe(6120);
    expect(rendimentoNoPeriodo(movs, "2026-01-01", "2026-12-31")).toBe(15960);
  });

  it("guardado no mês = depósitos − resgates", () => {
    expect(guardadoNoPeriodo(movs, "2026-11-01", "2026-11-30")).toBe(60000);
  });

  it("evolução no fim de cada mês", () => {
    expect(evolucaoMensal(movs, "2026-11-03", 6)).toEqual([
      { mes: "2026-06", total: 1200000 },
      { mes: "2026-07", total: 1200000 },
      { mes: "2026-08", total: 1250000 },
      { mes: "2026-09", total: 1250000 },
      { mes: "2026-10", total: 1259840 },
      { mes: "2026-11", total: 1325960 },
    ]);
  });
});

describe("sugestaoSemanal", () => {
  it("R$ 320 em 4 semanas = R$ 80 por semana", () => {
    expect(sugestaoSemanal(32000, "2026-11-12", "2026-12-10")).toBe(8000);
  });
  it("prazo menor que uma semana pede tudo de uma vez", () => {
    expect(sugestaoSemanal(32000, "2026-12-08", "2026-12-10")).toBe(32000);
  });
  it("meta atingida ou data passada não sugere nada", () => {
    expect(sugestaoSemanal(0, "2026-11-12", "2026-12-10")).toBeNull();
    expect(sugestaoSemanal(100, "2026-12-11", "2026-12-10")).toBeNull();
  });
});
