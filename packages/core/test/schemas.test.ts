import { describe, expect, it } from "vitest";
import { cartaoFormSchema, dataSchema, parcelamentoEmAndamentoSchema, saldoProjetado } from "../src";

const uuid = "4b0c3a52-7f0f-4f53-9a5e-2f5b2c6d9e10";

describe("schemas", () => {
  it("aceita o cartão XP", () => {
    const r = cartaoFormSchema.safeParse({
      nome: "XP",
      final: "4821",
      limite: 800000,
      diaVencimento: 10,
      vencimentoNaoUtil: "proximo_dia_util",
      fechamento: { tipo: "dias_antes", dias: 5, contagem: "uteis" },
      avisarAntesDoFechamento: true,
      pedirConfirmacaoMensal: true,
    });
    expect(r.success).toBe(true);
  });

  it("recusa valor em reais com centavos quebrados", () => {
    const r = cartaoFormSchema.shape.limite.safeParse(8000.5);
    expect(r.success).toBe(false);
  });

  it("recusa parcela atual maior que o total", () => {
    const r = parcelamentoEmAndamentoSchema.safeParse({
      descricao: "Notebook",
      cartaoId: uuid,
      categoriaId: null,
      valorParcela: 10000,
      totalParcelas: 10,
      parcelaAtual: 11,
      mesFatura: "2026-11",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["parcelaAtual"]);
  });

  it("recusa 31 de fevereiro", () => {
    expect(dataSchema.safeParse("2027-02-31").success).toBe(false);
  });
});

describe("saldoProjetado", () => {
  it("bate com o protótipo: R$ 2.965,10", () => {
    expect(
      saldoProjetado({
        saldoHoje: 315000,
        entradasPrevistas: 520000,
        faturasAVencer: 238490,
        contasFixas: 210000,
        transferenciasPlanejadas: 90000,
      }),
    ).toBe(296510);
  });
});
