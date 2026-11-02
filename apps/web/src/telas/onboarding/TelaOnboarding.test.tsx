import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { CartaoCompleto } from "@/services/cartoes-mapeamento";
import { TelaOnboarding } from "./TelaOnboarding";

const push = vi.fn();
const registrarSaldo = vi.fn();
const xp: CartaoCompleto = {
  id: "4b0c3a52-7f0f-4f53-9a5e-2f5b2c6d9e10", nome: "XP", final: "4821", limite: 800000, diaVencimento: 10,
  vencimentoNaoUtil: "proximo_dia_util", fechamento: { tipo: "dias_antes", dias: 5, contagem: "uteis" },
  avisarAntesDoFechamento: true, pedirConfirmacaoMensal: true,
};
let cartoes: CartaoCompleto[] = [xp];
let parcelamentos: unknown[] = [];

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/hooks/useCartoes", () => ({
  useCartoes: () => ({ isPending: false, isError: false, data: cartoes }),
  useSalvarCartao: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useCorrigirFatura: () => ({ mutate: vi.fn(), isPending: false, error: null, reset: vi.fn() }),
}));
vi.mock("@/hooks/useGastos", () => ({
  useCategorias: () => ({ isPending: false, isError: false, data: [] }),
  useFaturasResumo: () => ({ isPending: false, isError: false, data: [] }),
  useComprasDoInicio: (origem: string) => ({ isPending: false, isError: false, data: origem === "anterior_ao_app" ? parcelamentos : [] }),
  useRegistrarSaldoInicial: () => ({ mutate: registrarSaldo, isPending: false, error: null }),
  useRegistrarParcelamento: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}));
vi.mock("@/hooks/useFaturas", () => ({ useExcluirCompra: () => ({ mutate: vi.fn(), isPending: false }) }));

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T12:00:00-03:00"));
});
afterAll(() => vi.useRealTimers());
beforeEach(() => {
  push.mockReset();
  registrarSaldo.mockReset();
  cartoes = [xp];
  parcelamentos = [];
});

describe("TelaOnboarding", () => {
  it("passo 1 sem cartões abre o formulário do cartão", () => {
    cartoes = [];
    render(<TelaOnboarding passo="cartao" />);
    expect(screen.getByText("Passo 1 de 4")).toBeInTheDocument();
    expect(screen.getByLabelText("Apelido")).toBeInTheDocument();
  });

  it("passo 1 com cartão lista e continua para os parcelamentos", async () => {
    const user = userEvent.setup();
    render(<TelaOnboarding passo="cartao" />);
    expect(screen.getByText("Vence dia 10 · fecha 5 dias úteis antes")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(push).toHaveBeenCalledWith("/primeiros-passos/parcelamentos");
  });

  it("passo 2 sem parcelamentos oferece pular", async () => {
    const user = userEvent.setup();
    render(<TelaOnboarding passo="parcelamentos" />);
    await user.click(screen.getByRole("button", { name: "Não tenho parcelamentos" }));
    expect(push).toHaveBeenCalledWith("/primeiros-passos/fatura");
  });

  it("passo 2 mostra o comprometido dos parcelamentos lançados", () => {
    parcelamentos = [
      { id: "a", descricao: "Notebook", cartaoId: xp.id, valorTotal: 100000, totalParcelas: 10, parcelaAtual: 6, restante: 50000, faturaIds: [] },
    ];
    render(<TelaOnboarding passo="parcelamentos" />);
    expect(screen.getByText("XP · parcela 6 de 10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  });

  it("passo 3 registra o saldo inicial da fatura aberta", async () => {
    const user = userEvent.setup();
    render(<TelaOnboarding passo="fatura" />);
    await user.type(screen.getByLabelText("Já gasto na fatura de novembro"), "640");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(registrarSaldo.mock.calls[0]![0]).toEqual({ cartaoId: xp.id, valor: 64000, mesFatura: "2026-11" });
  });

  it("sem cartão, os passos seguintes mandam voltar ao primeiro", () => {
    cartoes = [];
    render(<TelaOnboarding passo="fatura" />);
    expect(screen.getByRole("link", { name: "Ir para o passo 1" })).toHaveAttribute("href", "/primeiros-passos/cartao");
  });
});
