import { render, screen, within } from "@testing-library/react";
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
let saldos: unknown[] = [];
let faturas: unknown[] = [];
const normalizar = (t: string | null | undefined) => (t ?? "").replace(/\u00a0/g, " ");

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/hooks/useCartoes", () => ({
  useCartoes: () => ({ isPending: false, isError: false, data: cartoes }),
  useSalvarCartao: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useCorrigirFatura: () => ({ mutate: vi.fn(), isPending: false, error: null, reset: vi.fn() }),
}));
vi.mock("@/hooks/useGastos", () => ({
  useCategorias: () => ({ isPending: false, isError: false, data: [] }),
  useFaturasResumo: () => ({ isPending: false, isError: false, data: faturas }),
  useComprasDoInicio: (origem: string) => ({ isPending: false, isError: false, data: origem === "anterior_ao_app" ? parcelamentos : saldos }),
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
  saldos = [];
  faturas = [];
});

describe("TelaOnboarding", () => {
  it("passo 1 sem cartões abre o formulário do cartão", () => {
    cartoes = [];
    render(<TelaOnboarding passo="cartao" />);
    expect(screen.getByRole("navigation", { name: "Primeiros passos: passo 1 de 4" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Cadastre seu primeiro cartão" })).toBeInTheDocument();
    expect(screen.getByLabelText("Apelido")).toBeInTheDocument();
  });

  it("passo 1 com cartão lista e continua para os parcelamentos", async () => {
    const user = userEvent.setup();
    render(<TelaOnboarding passo="cartao" />);
    expect(screen.getByText("Vence dia 10 · fecha 5 dias úteis antes")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Cartão XP, final 4821" })).toBeInTheDocument();
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
    const lista = screen.getByRole("region", { name: "Parcelamentos lançados" });
    expect(normalizar(lista.textContent)).toContain("NotebookXP · 06/10Faltam 500,00");
    expect(screen.getByRole("img", { name: "Parcela 6 de 10" })).toBeInTheDocument();
    expect(normalizar(lista.textContent)).toContain("Comprometido nas próximas faturas500,00");
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  });

  it("passo 3 registra o saldo inicial da fatura aberta", async () => {
    const user = userEvent.setup();
    render(<TelaOnboarding passo="fatura" />);
    const bloco = screen.getByRole("region", { name: "XP · fatura de novembro" });
    await user.type(within(bloco).getByLabelText("Já está na fatura (sem as parcelas)"), "640");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(registrarSaldo.mock.calls[0]![0]).toEqual({ cartaoId: xp.id, valor: 64000, mesFatura: "2026-11" });
  });

  it("sem cartão, os passos seguintes mandam voltar ao primeiro", () => {
    cartoes = [];
    render(<TelaOnboarding passo="fatura" />);
    expect(screen.getByRole("link", { name: "Ir para o passo 1" })).toHaveAttribute("href", "/primeiros-passos/cartao");
  });

  it("passo 4 resume o que foi configurado e mostra a fatura atual", () => {
    parcelamentos = [
      { id: "a", descricao: "Notebook", cartaoId: xp.id, valorTotal: 100000, totalParcelas: 10, parcelaAtual: 6, restante: 50000, faturaIds: [] },
    ];
    saldos = [{ id: "s", descricao: "Saldo inicial", cartaoId: xp.id, valorTotal: 120250, totalParcelas: 1, parcelaAtual: null, restante: 0, faturaIds: [] }];
    faturas = [
      { id: "f1", cartaoId: xp.id, mes: "2026-11", fechamento: "2026-11-03", vencimento: "2026-11-10", status: "estimado", pagaEm: null, total: 170250, lancamentos: 2, conferidos: 0 },
    ];
    render(<TelaOnboarding passo="pronto" />);
    const resumo = screen.getByRole("list", { name: "Resumo" });
    const itens = within(resumo).getAllByRole("listitem").map((i) => normalizar(i.textContent));
    expect(itens).toEqual(["✓1 cartãoXP", "✓1 parcelamento em andamento500,00 comprometidos", "✓Saldo inicial das faturas1.202,50"]);
    expect(normalizar(screen.getByRole("region", { name: "Prévia do painel" }).textContent)).toContain("R$ 1.702,50");
    expect(screen.getByRole("link", { name: "Começar a usar" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Pular" })).not.toBeInTheDocument();
  });
});
