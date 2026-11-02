import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { projetarFimDoMes } from "@financas/core";
import type { Conta, Recorrente } from "@/services/contas";
import { TelaContas } from "./TelaContas";

const CONTA = "8f7e6d5c-1111-4a2b-9c3d-0e1f2a3b4c5d";
const registrar = vi.fn();
const ajustar = vi.fn();

let contas: Conta[] = [{ id: CONTA, nome: "Conta XP", tipo: "corrente", conferidaEm: "2026-11-01", saldo: 315000 }];
const recorrentes: Recorrente[] = [
  { id: "sal", descricao: "Salário", tipo: "entrada", valor: 520000, dia: 5, contaId: CONTA, cartaoId: null, categoriaId: null },
  { id: "alu", descricao: "Aluguel", tipo: "saida", valor: 180000, dia: 5, contaId: CONTA, cartaoId: null, categoriaId: null },
];
const projecao = () =>
  projetarFimDoMes({
    hoje: "2026-11-01",
    saldoHoje: 315000,
    recorrentes,
    lancadasNoMes: new Set(),
    faturas: [{ id: "f", descricao: "Fatura XP", vencimento: "2026-11-10", total: 184250 }],
    agendados: [],
  });

vi.mock("@/hooks/useContas", () => ({
  useContas: () => ({ isPending: false, isError: false, data: contas }),
  useRecorrentes: () => ({ isPending: false, isError: false, data: recorrentes }),
  useMovimentosDoMes: () => ({ isPending: false, isError: false, data: [] }),
  useProjecao: () => ({ isPending: false, isError: false, data: contas.length ? projecao() : null, refetch: vi.fn() }),
  useRegistrarMovimento: () => ({ mutate: registrar, isPending: false, error: null }),
  useAjustarSaldo: () => ({ mutate: ajustar, isPending: false, error: null }),
  useCriarConta: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useSalvarRecorrente: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useDesativarRecorrente: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useExcluirMovimento: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}));

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T12:00:00-03:00"));
});
afterAll(() => vi.useRealTimers());
beforeEach(() => {
  registrar.mockReset();
  ajustar.mockReset();
  contas = [{ id: CONTA, nome: "Conta XP", tipo: "corrente", conferidaEm: "2026-11-01", saldo: 315000 }];
});

const normalizar = (t: string | null | undefined) => (t ?? "").replace(/\u00a0/g, " ");

describe("TelaContas", () => {
  it("sem contas, convida a cadastrar", () => {
    contas = [];
    render(<TelaContas />);
    expect(screen.getByRole("button", { name: "Cadastrar conta" })).toBeInTheDocument();
  });

  it("mostra a sobra e os próximos movimentos com saldo acumulado", () => {
    render(<TelaContas />);
    expect(normalizar(screen.getByRole("region", { name: "Sobra em 30/11" }).textContent)).toContain("R$ 4.707,50");
    const proximos = normalizar(screen.getByRole("region", { name: "Próximos movimentos" }).textContent);
    expect(proximos).toContain("Salário05/11 · recorrente · tocar para lançar+ R$ 5.200,00R$ 8.350,00");
    expect(proximos).toContain("Fatura XP10/11 · fatura do cartão− R$ 1.842,50R$ 4.707,50");
  });

  it("lança uma recorrência prevista já preenchida", async () => {
    const user = userEvent.setup();
    render(<TelaContas />);
    await user.click(within(screen.getByRole("region", { name: "Próximos movimentos" })).getByRole("button", { name: /^Salário/ }));
    const dialogo = screen.getByRole("dialog");
    expect(within(dialogo).getByLabelText("Descrição")).toHaveValue("Salário");
    await user.click(within(dialogo).getByRole("button", { name: "Lançar" }));
    expect(registrar.mock.calls[0]![0]).toEqual({
      form: { contaId: CONTA, tipo: "entrada", valor: 520000, descricao: "Salário", data: "2026-11-01", categoriaId: null },
      recorrenteId: "sal",
    });
  });

  it("ajusta o saldo com o valor do banco", async () => {
    const user = userEvent.setup();
    render(<TelaContas />);
    await user.click(screen.getByRole("button", { name: /Conta XP/ }));
    const dialogo = screen.getByRole("dialog");
    const campo = within(dialogo).getByLabelText("Saldo no banco agora");
    await user.clear(campo);
    await user.type(campo, "2890");
    expect(normalizar(dialogo.textContent)).toContain("A diferença de − R$ 260,00 será lançada como ajuste.");
    await user.click(within(dialogo).getByRole("button", { name: "Lançar ajuste" }));
    expect(ajustar.mock.calls[0]![0]).toEqual({ contaId: CONTA, saldoReal: 289000 });
  });

  it("registra uma saída avulsa", async () => {
    const user = userEvent.setup();
    render(<TelaContas />);
    await user.click(screen.getByRole("button", { name: "Saída / Pix" }));
    const dialogo = screen.getByRole("dialog");
    await user.type(within(dialogo).getByLabelText("Valor"), "120");
    await user.type(within(dialogo).getByLabelText("Descrição"), "Pix para Ana");
    await user.click(within(dialogo).getByRole("button", { name: "Lançar" }));
    expect(registrar.mock.calls[0]![0]).toEqual({
      form: { contaId: CONTA, tipo: "saida", valor: 12000, descricao: "Pix para Ana", data: "2026-11-01", categoriaId: null },
      recorrenteId: undefined,
    });
  });
});
