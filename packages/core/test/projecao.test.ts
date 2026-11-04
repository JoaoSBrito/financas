import { describe, expect, it } from "vitest";
import { projetarFimDoMes } from "../src";

const recorrentes = [
  { id: "sal", descricao: "Salário", tipo: "entrada" as const, valor: 520000, dia: 5 },
  { id: "alu", descricao: "Aluguel", tipo: "saida" as const, valor: 180000, dia: 5 },
  { id: "luz", descricao: "Luz", tipo: "saida" as const, valor: 18000, dia: 15 },
  { id: "net", descricao: "Internet", tipo: "saida" as const, valor: 12000, dia: 20 },
];
const faturas = [
  { id: "fxp", descricao: "Fatura XP", vencimento: "2026-11-10", total: 184250 },
  { id: "fvg", descricao: "Fatura Viagens", vencimento: "2026-11-30", total: 54240 },
  { id: "fdez", descricao: "Fatura XP", vencimento: "2026-12-10", total: 130000 },
];

describe("projetarFimDoMes", () => {
  const p = projetarFimDoMes({ hoje: "2026-11-01", saldoHoje: 315000, recorrentes, lancadasNoMes: new Set(), faturas, agendados: [] });

  it("sobra = saldo + entradas − faturas − contas fixas", () => {
    expect(p.ate).toBe("2026-11-30");
    expect(p.entradasPrevistas).toBe(520000);
    expect(p.faturasAVencer).toBe(238490);
    expect(p.contasFixas).toBe(210000);
    expect(p.saldoFinal).toBe(315000 + 520000 - 238490 - 210000);
  });

  it("ordena por data com entradas primeiro e acumula o saldo", () => {
    expect(p.itens.map((i) => `${i.data.slice(8)} ${i.descricao} ${i.saldoApos}`)).toEqual([
      "05 Salário 835000",
      "05 Aluguel 655000",
      "10 Fatura XP 470750",
      "15 Luz 452750",
      "20 Internet 440750",
      "30 Fatura Viagens 386510",
    ]);
  });

  it("ignora recorrências já lançadas ou que já passaram", () => {
    const depois = projetarFimDoMes({
      hoje: "2026-11-12",
      saldoHoje: 400000,
      recorrentes,
      lancadasNoMes: new Set(["luz"]),
      faturas,
      agendados: [],
    });
    expect(depois.itens.map((i) => i.descricao)).toEqual(["Internet", "Fatura Viagens"]);
  });

  it("dia 31 vira o último dia de meses curtos", () => {
    const r = projetarFimDoMes({
      hoje: "2027-02-01",
      saldoHoje: 0,
      recorrentes: [{ id: "x", descricao: "Cartão", tipo: "saida", valor: 100, dia: 31 }],
      lancadasNoMes: new Set(),
      faturas: [],
      agendados: [],
    });
    expect(r.itens[0]!.data).toBe("2027-02-28");
  });

  it("inclui movimentos já agendados para depois de hoje", () => {
    const r = projetarFimDoMes({
      hoje: "2026-11-01",
      saldoHoje: 1000,
      recorrentes: [],
      lancadasNoMes: new Set(),
      faturas: [],
      agendados: [{ id: "m1", data: "2026-11-08", descricao: "Pix agendado", valor: -500 }],
    });
    expect(r.saldoFinal).toBe(500);
    expect(r.itens[0]).toMatchObject({ origem: "agendado", referencia: "m1" });
    expect(r.menorSaldo).toBe(500);
  });
});
