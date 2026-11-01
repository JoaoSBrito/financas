import { describe, expect, it } from "vitest";
import { projetarSaldo, totalDeGastos, type Movimento } from "../src";

const novembro: Movimento[] = [
  { data: "2026-11-28", descricao: "Fatura Viagens", valor: -54240, tipo: "transferencia" },
  { data: "2026-11-05", descricao: "Salário", valor: 520000, tipo: "entrada" },
  { data: "2026-11-05", descricao: "Aluguel", valor: -180000, tipo: "saida" },
  { data: "2026-11-10", descricao: "Fatura XP", valor: -184250, tipo: "transferencia" },
  { data: "2026-11-10", descricao: "Caixinhas", valor: -90000, tipo: "transferencia" },
  { data: "2026-11-15", descricao: "Luz", valor: -18000, tipo: "saida" },
  { data: "2026-11-20", descricao: "Internet", valor: -12000, tipo: "saida" },
];

describe("projetarSaldo", () => {
  it("sobra R$ 2.965,10 em 30/nov", () => {
    expect(projetarSaldo(315000, novembro).saldoFinal).toBe(296510);
  });

  it("mostra o saldo após cada movimento, em ordem de data", () => {
    const { pontos } = projetarSaldo(315000, novembro);
    expect(pontos[0]).toMatchObject({ descricao: "Salário", saldoApos: 835000 });
    expect(pontos.at(-1)).toMatchObject({ descricao: "Fatura Viagens", saldoApos: 296510 });
  });
});

describe("totalDeGastos", () => {
  it("não conta fatura nem caixinha como gasto", () => {
    expect(totalDeGastos(novembro)).toBe(210000);
  });
});
