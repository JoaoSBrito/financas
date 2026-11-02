import { describe, expect, it } from "vitest";
import {
  cartaoParaFormulario,
  formularioParaLinha,
  linhaParaCartao,
  planejarSincronizacao,
  type CartaoLinha,
  type Fatura,
} from "./cartoes-mapeamento";

const linhaXp: CartaoLinha = {
  id: "4b0c3a52-7f0f-4f53-9a5e-2f5b2c6d9e10",
  nome: "XP",
  final: "4821",
  limite: 800000,
  dia_vencimento: 10,
  vencimento_nao_util: "proximo_dia_util",
  fechamento_tipo: "dias_antes",
  fechamento_dia: null,
  fechamento_dias: 5,
  fechamento_contagem: "uteis",
  avisar_antes_do_fechamento: true,
  pedir_confirmacao_mensal: true,
};

describe("mapeamento do cartão", () => {
  it("linha → formulário → linha preserva os dados", () => {
    const { id, ...semId } = linhaXp;
    expect(formularioParaLinha(cartaoParaFormulario(linhaParaCartao(linhaXp)))).toEqual(semId);
    expect(id).toBeTruthy();
  });

  it("limpa campos de outras regras ao trocar para dia fixo", () => {
    const form = { ...cartaoParaFormulario(linhaParaCartao(linhaXp)), fechamento: { tipo: "dia_fixo" as const, dia: 3 } };
    expect(formularioParaLinha(form)).toMatchObject({
      fechamento_tipo: "dia_fixo",
      fechamento_dia: 3,
      fechamento_dias: null,
      fechamento_contagem: null,
    });
  });
});

describe("planejarSincronizacao", () => {
  const cartao = linhaParaCartao(linhaXp);
  const fatura = (mes: string, fechamento: string, vencimento: string, status: Fatura["status"]): Fatura => ({
    id: mes,
    cartaoId: cartao.id,
    mes,
    fechamento,
    vencimento,
    status,
    pagaEm: null,
  });

  it("cria 12 faturas estimadas para um cartão novo", () => {
    const plano = planejarSincronizacao({ cartao, existentes: [], hoje: "2026-11-01" });
    expect(plano.gravar).toHaveLength(12);
    expect(plano.gravar[0]).toMatchObject({ mes: "2026-11-01", fechamento: "2026-11-03", status: "estimada" });
  });

  it("não toca em faturas confirmadas nem nas que já estão certas", () => {
    const plano = planejarSincronizacao({
      cartao,
      existentes: [
        fatura("2026-11", "2026-11-02", "2026-11-10", "confirmado"),
        fatura("2026-12", "2026-12-03", "2026-12-10", "estimado"),
      ],
      hoje: "2026-11-01",
    });
    const meses = plano.gravar.map((g) => g.mes);
    expect(meses).not.toContain("2026-11-01");
    expect(meses).not.toContain("2026-12-01");
    expect(plano.ciclos[0]).toMatchObject({ fechamento: "2026-11-02", status: "confirmado" });
  });

  it("atualiza a estimada quando a regra muda", () => {
    const plano = planejarSincronizacao({
      cartao,
      existentes: [fatura("2026-12", "2026-12-01", "2026-12-10", "estimado")],
      hoje: "2026-11-01",
    });
    expect(plano.gravar.find((g) => g.mes === "2026-12-01")).toMatchObject({ fechamento: "2026-12-03" });
  });

  it("estende o horizonte até depois da última parcela", () => {
    const plano = planejarSincronizacao({ cartao, existentes: [], hoje: "2026-11-01", ultimoMesUsado: "2028-03" });
    expect(plano.gravar.at(-1)?.mes).toBe("2028-04-01");
  });
});
