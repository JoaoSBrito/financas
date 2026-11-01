import { describe, expect, it } from "vitest";
import { ajustarComSaldoReal, estimarRendimento } from "../src";

const tresDias = [
  { data: "2026-11-03", taxaDia: 0.05 },
  { data: "2026-11-04", taxaDia: 0.05 },
  { data: "2026-11-05", taxaDia: 0.05 },
];

describe("estimarRendimento", () => {
  it("sem % do CDI a caixinha não rende sozinha", () => {
    expect(estimarRendimento(100000, null, tresDias)).toEqual({ saldoEstimado: 100000, rendimento: 0 });
  });

  it("110% do CDI rende mais que 100%", () => {
    const cem = estimarRendimento(1000000, 100, tresDias).rendimento;
    const cento10 = estimarRendimento(1000000, 110, tresDias).rendimento;
    expect(cem).toBe(1501); // juros compostos: 1,0005^3
    expect(cento10).toBeGreaterThan(cem);
  });
});

describe("ajustarComSaldoReal", () => {
  it("a diferença para o banco vira rendimento", () => {
    expect(ajustarComSaldoReal(98000, 98730)).toBe(730);
  });
});
