import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Caixinha } from "@/services/caixinhas";
import { TelaCaixinhas } from "./TelaCaixinhas";

const CONTA = "8f7e6d5c-1111-4a2b-9c3d-0e1f2a3b4c5d";
const movimentar = vi.fn();
const salvar = vi.fn();
let caixinhas: Caixinha[] = [];

vi.mock("@/hooks/useCaixinhas", () => ({
  useCaixinhas: () => ({ isPending: false, isError: false, data: caixinhas }),
  useMovimentosCaixinhas: () => ({
    isPending: false,
    isError: false,
    data: [
      { caixinhaId: "r", data: "2026-06-10", valor: 1200000, tipo: "deposito" },
      { caixinhaId: "r", data: "2026-11-01", valor: 15230, tipo: "rendimento_estimado" },
    ],
  }),
  useMovimentarCaixinha: () => ({ mutate: movimentar, isPending: false, error: null }),
  useSalvarCaixinha: () => ({ mutate: salvar, isPending: false, error: null }),
  useArquivarCaixinha: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useAtualizarSaldoCaixinha: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}));
vi.mock("@/hooks/useCartoes", () => ({ useCartoes: () => ({ isPending: false, isError: false, data: [] }) }));
vi.mock("@/hooks/useGastos", () => ({ useFaturasResumo: () => ({ isPending: false, isError: false, data: [] }) }));
vi.mock("@/hooks/useContas", () => ({
  useContas: () => ({ data: [{ id: CONTA, nome: "Conta XP", tipo: "corrente", conferidaEm: null, saldo: 315000 }] }),
}));
vi.mock("@/hooks/useReserva", () => ({
  useCustoDeVida: () => ({ isPending: false, isError: false, data: { valor: 410000, mesesUsados: ["2026-08", "2026-09", "2026-10"], fonte: "media" } }),
}));
vi.mock("next/dynamic", () => ({ default: () => () => <div data-testid="grafico" /> }));

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-12T12:00:00-03:00"));
});
afterAll(() => vi.useRealTimers());
beforeEach(() => {
  movimentar.mockReset();
  salvar.mockReset();
  caixinhas = [
    { id: "r", nome: "Reserva", meta: 2000000, dataMeta: null, cartaoId: null, percentualCdi: 102, saldo: 1215230, reservaMeses: null },
  ];
});

const normalizar = (t: string | null | undefined) => (t ?? "").replace(/\u00a0/g, " ");

describe("TelaCaixinhas", () => {
  it("sem caixinhas, convida a criar", () => {
    caixinhas = [];
    render(<TelaCaixinhas />);
    expect(screen.getByRole("button", { name: "Criar caixinha" })).toBeInTheDocument();
  });

  it("mostra patrimônio, rendimento e a caixinha", () => {
    render(<TelaCaixinhas />);
    const t = normalizar(screen.getByRole("region", { name: "Patrimônio guardado" }).textContent);
    expect(t).toContain("R$ 12.152,30");
    expect(t).toContain("Rendeu no mês+ R$ 152,30");
    expect(normalizar(screen.getByRole("article", { name: "Reserva" }).textContent)).toContain("102% do CDI");
  });

  it("guarda dinheiro da conta na caixinha", async () => {
    const user = userEvent.setup();
    render(<TelaCaixinhas />);
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    const dialogo = screen.getByRole("dialog");
    await user.type(within(dialogo).getByLabelText("Valor"), "500");
    await user.click(within(dialogo).getAllByRole("button", { name: "Guardar" }).at(-1)!);
    expect(movimentar.mock.calls[0]![0]).toEqual({ caixinhaId: "r", contaId: CONTA, tipo: "deposito", valor: 50000, data: "2026-11-12" });
  });

  it("não deixa resgatar mais que o saldo", async () => {
    const user = userEvent.setup();
    render(<TelaCaixinhas />);
    await user.click(screen.getByRole("button", { name: "Resgatar" }));
    const dialogo = screen.getByRole("dialog");
    await user.type(within(dialogo).getByLabelText("Valor"), "20000");
    await user.click(within(dialogo).getAllByRole("button", { name: "Resgatar" }).at(-1)!);
    expect(screen.getByText("Valor maior que o saldo da caixinha")).toBeInTheDocument();
    expect(movimentar).not.toHaveBeenCalled();
  });

  it("cria caixinha com saldo inicial e % do CDI opcional", async () => {
    const user = userEvent.setup();
    render(<TelaCaixinhas />);
    await user.click(screen.getByRole("button", { name: "Caixinha" }));
    const dialogo = screen.getByRole("dialog");
    await user.type(within(dialogo).getByLabelText("Nome"), "Viagem");
    await user.type(within(dialogo).getByLabelText("Quanto já tem guardado"), "1000");
    await user.type(within(dialogo).getByLabelText("% do CDI (opcional)"), "100,5");
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }));
    expect(salvar.mock.calls[0]![0]).toEqual({
      id: undefined,
      form: { nome: "Viagem", meta: null, dataMeta: null, cartaoId: null, percentualCdi: 100.5, reservaMeses: null },
      saldoAtual: 100000,
    });
  });

  it("caixinha marcada como reserva mostra selo e cobertura pelo custo de vida", () => {
    caixinhas = [{ ...caixinhas[0]!, reservaMeses: 6, meta: null }];
    render(<TelaCaixinhas />);
    const card = normalizar(screen.getByRole("article", { name: "Reserva" }).textContent);
    expect(card).toContain("Reserva de emergência");
    expect(card).toContain("meta R$ 24.600,00");
    expect(card).toContain("Cobre 2,9 de 6 meses de custo de vida");
  });

  it("ligar a reserva troca meta, data e cartão pelo contador de meses", async () => {
    const user = userEvent.setup();
    render(<TelaCaixinhas />);
    await user.click(screen.getByRole("button", { name: "Caixinha" }));
    const dialogo = screen.getByRole("dialog");
    await user.type(within(dialogo).getByLabelText("Nome"), "Reserva nova");
    await user.type(within(dialogo).getByLabelText("Meta (opcional)"), "500");
    await user.click(within(dialogo).getByRole("switch", { name: "Reserva de emergência" }));
    expect(within(dialogo).queryByLabelText("Meta (opcional)")).not.toBeInTheDocument();
    expect(within(dialogo).queryByLabelText("Data da meta (opcional)")).not.toBeInTheDocument();
    expect(normalizar(dialogo.textContent)).toContain("R$ 4.100,00/mês · média de ago a out");
    expect(normalizar(dialogo.textContent)).toContain("6 × custo de vida = R$ 24.600,00");
    await user.click(within(dialogo).getByRole("button", { name: "Aumentar meses de cobertura" }));
    expect(normalizar(dialogo.textContent)).toContain("7 × custo de vida = R$ 28.700,00");
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }));
    expect(salvar.mock.calls[0]![0].form).toEqual({
      nome: "Reserva nova",
      meta: null,
      dataMeta: null,
      cartaoId: null,
      percentualCdi: null,
      reservaMeses: 7,
    });
  });
});
