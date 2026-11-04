import { describe, expect, it } from "vitest";
import { calcularCustoDeVida, caixinhaFormSchema, situacaoDaReserva, transferenciaEntreContasSchema } from "../src";

describe("calcularCustoDeVida", () => {
  it("média dos 3 meses completos: faturas + saídas da conta", () => {
    const r = calcularCustoDeVida({
      hoje: "2026-11-12",
      faturasPorMes: new Map([["2026-08", 200000], ["2026-09", 230000], ["2026-10", 250000], ["2026-11", 999999]]),
      saidasPorMes: new Map([["2026-08", 210000], ["2026-09", 210000], ["2026-10", 230000]]),
      contasFixas: 210000,
    });
    expect(r).toEqual({ valor: 443333, mesesUsados: ["2026-08", "2026-09", "2026-10"], fonte: "media" });
  });

  it("começo de uso: média só dos meses com dados", () => {
    const r = calcularCustoDeVida({
      hoje: "2026-12-05",
      faturasPorMes: new Map([["2026-11", 238490]]),
      saidasPorMes: new Map([["2026-11", 210000]]),
      contasFixas: 210000,
    });
    expect(r).toEqual({ valor: 448490, mesesUsados: ["2026-11"], fonte: "media" });
  });

  it("sem nenhum mês completo, usa as contas fixas", () => {
    const r = calcularCustoDeVida({ hoje: "2026-11-12", faturasPorMes: new Map(), saidasPorMes: new Map(), contasFixas: 210000 });
    expect(r).toEqual({ valor: 210000, mesesUsados: [], fonte: "contas_fixas" });
  });

  it("sem dado nenhum", () => {
    expect(calcularCustoDeVida({ hoje: "2026-11-12", faturasPorMes: new Map(), saidasPorMes: new Map(), contasFixas: 0 }).fonte).toBe("sem_dados");
  });
});

describe("situacaoDaReserva", () => {
  it("6 meses de R$ 4.100 e saldo de R$ 12.800", () => {
    expect(situacaoDaReserva(1280000, 6, 410000)).toEqual({ sugerida: 2460000, cobertura: 3.1 });
  });
  it("sem custo de vida não calcula", () => {
    expect(situacaoDaReserva(1280000, 6, 0)).toEqual({ sugerida: null, cobertura: null });
  });
});

describe("schemas", () => {
  it("reserva entre 1 e 36 meses", () => {
    const base = { nome: "Reserva", meta: null, dataMeta: null, cartaoId: null, percentualCdi: null };
    expect(caixinhaFormSchema.safeParse({ ...base, reservaMeses: 6 }).success).toBe(true);
    expect(caixinhaFormSchema.safeParse({ ...base, reservaMeses: 40 }).success).toBe(false);
  });
  it("transferência exige contas diferentes", () => {
    const id = "8f7e6d5c-1111-4a2b-9c3d-0e1f2a3b4c5d";
    const r = transferenciaEntreContasSchema.safeParse({ origemId: id, destinoId: id, valor: 100, data: "2026-11-12", descricao: "" });
    expect(r.success).toBe(false);
  });
});
