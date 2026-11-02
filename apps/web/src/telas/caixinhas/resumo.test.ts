import { describe, expect, it } from "vitest";
import type { CartaoCompleto } from "@/services/cartoes-mapeamento";
import type { Caixinha } from "@/services/caixinhas";
import { detalheDaCaixinha, dicaDaCaixinha, resumirPatrimonio } from "./resumo";

const xp: CartaoCompleto = {
  id: "xp", nome: "XP", final: null, limite: 800000, diaVencimento: 10, vencimentoNaoUtil: "proximo_dia_util",
  fechamento: { tipo: "dias_antes", dias: 5, contagem: "uteis" }, avisarAntesDoFechamento: true, pedirConfirmacaoMensal: true,
};
const fatura: Caixinha = { id: "f", nome: "Pagar fatura", meta: 130000, dataMeta: null, cartaoId: "xp", percentualCdi: 100, saldo: 98000 };

describe("caixinhas", () => {
  it("vinculada ao cartão mira o vencimento da fatura aberta", () => {
    // Em 12/11 a fatura aberta do XP vence em 10/12: 4 semanas para juntar R$ 320.
    expect(dicaDaCaixinha(fatura, [xp], [], "2026-11-12")).toBe("Guarde R$\u00a080,00 por semana para cobrir a fatura");
  });

  it("com data de meta, usa a data", () => {
    const viagem = { ...fatura, cartaoId: null, dataMeta: "2027-07-01", meta: 800000, saldo: 547000 };
    expect(dicaDaCaixinha(viagem, [xp], [], "2026-11-12")).toMatch(/por semana para chegar à meta$/);
  });

  it("sem meta não há dica; meta atingida avisa", () => {
    expect(dicaDaCaixinha({ ...fatura, meta: null }, [xp], [], "2026-11-12")).toBeUndefined();
    expect(dicaDaCaixinha({ ...fatura, saldo: 130000 }, [xp], [], "2026-11-12")).toBe("Meta atingida");
  });

  it("descreve vínculo e rendimento", () => {
    expect(detalheDaCaixinha(fatura, [xp])).toBe("Vinculada ao cartão XP · 100% do CDI");
    expect(detalheDaCaixinha({ ...fatura, cartaoId: null, percentualCdi: null }, [xp])).toBe("Atualização manual");
  });

  it("resume patrimônio e rendimentos", () => {
    const r = resumirPatrimonio([fatura], [
      { caixinhaId: "f", data: "2026-11-02", valor: 500, tipo: "rendimento_estimado" },
      { caixinhaId: "f", data: "2026-03-02", valor: 900, tipo: "ajuste" },
      { caixinhaId: "f", data: "2026-11-03", valor: 8000, tipo: "deposito" },
    ], "2026-11-12");
    expect(r).toEqual({ total: 98000, rendeuNoMes: 500, rendeuNoAno: 1400, guardadoNoMes: 8000 });
  });
});
