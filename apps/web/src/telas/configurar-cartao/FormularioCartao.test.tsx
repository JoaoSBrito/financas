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
const normalizar = (t: string | null | undefined) => (t ?? "").replace(/\u00a0/g, " ");

describe("FormularioCartao", () => {
  it("mostra os próximos fechamentos do XP em tabela (fecha → vence)", () => {
    render(<FormularioCartao inicial={xp} faturas={[]} />);
    const previa = screen.getByRole("region", { name: "Próximos fechamentos" });
    const linhas = within(previa).getAllByRole("listitem").map((l) => normalizar(l.textContent));
    expect(linhas).toEqual([
      "nov03/11 → 10/11Estimado",
      "dez03/12 → 10/12Estimado",
      // 10/01/2027 é domingo: o vencimento vai para o próximo dia útil e a observação aparece.
      "jan04/01 → 11/01dia 10 não é dia útilEstimado",
      "fev01/02 → 10/02Estimado",
    ]);
  });

  it("atualiza a prévia ao mudar a regra", async () => {
    const user = userEvent.setup();
    render(<FormularioCartao inicial={xp} faturas={[]} />);
    await user.click(screen.getByRole("button", { name: "Corridos" }));
    const previa = screen.getByRole("region", { name: "Próximos fechamentos" });
    expect(within(previa).getByRole("listitem", { name: "Fatura de novembro de 2026" })).toHaveTextContent("05/11 → 10/11");
  });

  it("mostra o cartão físico com os dados digitados", async () => {
    const user = userEvent.setup();
    render(<FormularioCartao inicial={CARTAO_NOVO} faturas={[]} indiceCor={1} />);
    expect(screen.getByRole("img", { name: "Cartão Novo cartão" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Apelido"), "Viagens");
    await user.type(screen.getByLabelText("Final"), "1234");
    await user.type(screen.getByLabelText("Limite"), "5000");
    const cartao = screen.getByRole("img", { name: "Cartão Viagens, final 1234" });
    expect(normalizar(cartao.textContent)).toContain("Limite 5.000,00");
    expect(normalizar(cartao.textContent)).toContain("Vence dia 10");
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
