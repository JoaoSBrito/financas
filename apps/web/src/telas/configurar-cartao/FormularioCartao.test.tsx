import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { CartaoForm } from "@financas/core";
import { FormularioCartao } from "./FormularioCartao";
import { CARTAO_NOVO } from "./valores";

const mutate = vi.fn();
vi.mock("@/hooks/useCartoes", () => ({
  useSalvarCartao: () => ({ mutate, isPending: false, error: null }),
  useCorrigirFatura: () => ({ mutate: vi.fn(), isPending: false, error: null, reset: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const xp: CartaoForm = {
  ...CARTAO_NOVO,
  nome: "XP",
  final: "4821",
  limite: 800000,
  fechamento: { tipo: "dias_antes", dias: 5, contagem: "uteis" },
};

beforeAll(() => {
  // Só o relógio do Date é falso: "hoje" = 1º de novembro de 2026.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T12:00:00-03:00"));
});
afterAll(() => vi.useRealTimers());
beforeEach(() => mutate.mockReset());

describe("FormularioCartao", () => {
  it("mostra a prévia dos fechamentos do XP", () => {
    render(<FormularioCartao inicial={xp} faturas={[]} />);
    const previa = screen.getByRole("region", { name: "Próximos fechamentos" });
    expect(within(previa).getByText("Fecha 03/11")).toBeInTheDocument();
    expect(within(previa).getByText("Fecha 04/01")).toBeInTheDocument();
    expect(within(previa).getByText("Vence 11/01 · dia 10 não é dia útil")).toBeInTheDocument();
    expect(within(previa).getByText("Fecha 01/02")).toBeInTheDocument();
  });

  it("atualiza a prévia ao mudar a regra", async () => {
    const user = userEvent.setup();
    render(<FormularioCartao inicial={xp} faturas={[]} />);
    await user.click(screen.getByRole("button", { name: "Corridos" }));
    const previa = screen.getByRole("region", { name: "Próximos fechamentos" });
    expect(within(previa).getByText("Fecha 05/11")).toBeInTheDocument();
  });

  it("não salva sem apelido e sem limite", async () => {
    const user = userEvent.setup();
    render(<FormularioCartao inicial={CARTAO_NOVO} faturas={[]} />);
    await user.click(screen.getByRole("button", { name: "Salvar cartão" }));
    expect(await screen.findByText("Informe o apelido do cartão")).toBeInTheDocument();
    expect(screen.getByText("O valor precisa ser maior que zero")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("salva o cartão com os dados do formulário", async () => {
    const user = userEvent.setup();
    render(<FormularioCartao inicial={CARTAO_NOVO} faturas={[]} />);
    await user.type(screen.getByLabelText("Apelido"), "XP");
    await user.type(screen.getByLabelText("Limite"), "8000");
    await user.click(screen.getByRole("button", { name: "Salvar cartão" }));
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0]![0]).toMatchObject({
      nome: "XP",
      limite: 800000,
      diaVencimento: 10,
      fechamento: { tipo: "dias_antes", dias: 7, contagem: "corridos" },
    });
  });
});
