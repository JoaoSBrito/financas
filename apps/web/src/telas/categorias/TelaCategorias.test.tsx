import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { CartaoCompleto } from "@/services/cartoes-mapeamento";
import { TelaCategorias } from "./TelaCategorias";

const LAZER = "1c9e2b6a-1111-4c2d-9e3f-0a1b2c3d4e5f";
const MERCADO = "2c9e2b6a-2222-4c2d-9e3f-0a1b2c3d4e5f";
const salvar = vi.fn();
const arquivar = vi.fn();

const xp: CartaoCompleto = {
  id: "xp", nome: "XP", final: null, limite: 800000, diaVencimento: 10, vencimentoNaoUtil: "proximo_dia_util",
  fechamento: { tipo: "dias_antes", dias: 5, contagem: "uteis" }, avisarAntesDoFechamento: true, pedirConfirmacaoMensal: true,
};

vi.mock("@/hooks/useCartoes", () => ({ useCartoes: () => ({ isPending: false, isError: false, data: [xp] }) }));
vi.mock("@/hooks/useGastos", () => ({
  useFaturasResumo: () => ({ isPending: false, isError: false, data: [] }),
  useCategorias: () => ({ isPending: false, isError: false, data: [{ id: LAZER, nome: "Lazer" }, { id: MERCADO, nome: "Mercado" }] }),
}));
vi.mock("@/hooks/useInicio", () => ({
  useOrcamentos: () => ({ isPending: false, isError: false, data: new Map([[LAZER, 40000]]) }),
  useSaidasDoMes: () => ({ data: [{ data: "2026-11-05", valor: -3000, categoriaId: MERCADO }] }),
  useLancamentosDoMes: () => ({
    isPending: false,
    isError: false,
    data: [{ mes: "2026-11", valor: 36800, categoriaId: LAZER }, { mes: "2026-11", valor: 18640, categoriaId: MERCADO }],
  }),
}));
vi.mock("@/hooks/useCategorias", () => ({
  useSalvarCategoria: () => ({ mutate: salvar, isPending: false, error: null }),
  useArquivarCategoria: () => ({ mutate: arquivar, isPending: false, error: null }),
}));

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T12:00:00-03:00"));
});
afterAll(() => vi.useRealTimers());
beforeEach(() => {
  salvar.mockReset();
  arquivar.mockReset();
});

const normalizar = (t: string | null | undefined) => (t ?? "").replace(/\u00a0/g, " ");

describe("TelaCategorias", () => {
  it("resume o orçamento e separa as categorias com e sem orçamento", () => {
    render(<TelaCategorias />);
    const resumo = screen.getByRole("region", { name: "Resumo do orçamento" });
    expect(normalizar(resumo.textContent)).toBe("Orçado400Gasto com orçamento36892% usado1 em atenção");
    expect(within(resumo).getByRole("img", { name: "92% do orçamento usado" })).toBeInTheDocument();

    const com = screen.getByRole("region", { name: "Com orçamento" });
    expect(normalizar(within(com).getByRole("button", { name: /^Lazer/ }).textContent)).toBe("Lazer368 / 40092%");
    const sem = screen.getByRole("region", { name: "Sem orçamento" });
    expect(normalizar(within(sem).getByRole("button", { name: /^Mercado/ }).textContent)).toBe("MercadoSem orçamento · definir216");
  });

  it("define um orçamento e mostra os valores exatos dos alertas", async () => {
    const user = userEvent.setup();
    render(<TelaCategorias />);
    await user.click(screen.getByRole("button", { name: /^Mercado/ }));
    const dialogo = screen.getByRole("dialog", { name: "Editar categoria" });
    expect(within(dialogo).queryByRole("region", { name: "Alertas" })).not.toBeInTheDocument();
    await user.type(within(dialogo).getByLabelText("Orçamento mensal"), "1200");
    const alertas = within(dialogo).getByRole("region", { name: "Alertas" });
    expect(normalizar(alertas.textContent)).toBe("AlertasAtenção em 80%960,00Estouro em 100%1.200,00");
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }));
    expect(salvar.mock.calls[0]![0]).toEqual({
      id: MERCADO,
      form: { nome: "Mercado", orcamentoMensal: 120000 },
      orcamentoAtual: null,
    });
  });

  it("remove o orçamento ao apagar o valor", async () => {
    const user = userEvent.setup();
    render(<TelaCategorias />);
    await user.click(screen.getByRole("button", { name: /^Lazer/ }));
    const dialogo = screen.getByRole("dialog");
    await user.clear(within(dialogo).getByLabelText("Orçamento mensal"));
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }));
    expect(salvar.mock.calls[0]![0]).toMatchObject({ form: { nome: "Lazer", orcamentoMensal: null }, orcamentoAtual: 40000 });
  });

  it("cria categoria nova e pede confirmação para arquivar (não existe excluir)", async () => {
    const user = userEvent.setup();
    render(<TelaCategorias />);
    await user.click(screen.getByRole("button", { name: "Nova" }));
    let dialogo = screen.getByRole("dialog", { name: "Nova categoria" });
    await user.type(within(dialogo).getByLabelText("Nome"), "Pets");
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }));
    expect(salvar.mock.calls[0]![0]).toEqual({ id: undefined, form: { nome: "Pets", orcamentoMensal: null }, orcamentoAtual: null });

    await user.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: /^Lazer/ }));
    dialogo = screen.getByRole("dialog");
    expect(within(dialogo).queryByRole("button", { name: /Excluir/ })).not.toBeInTheDocument();
    await user.click(within(dialogo).getByRole("button", { name: "Arquivar" }));
    await user.click(within(screen.getByRole("dialog", { name: "Arquivar categoria?" })).getByRole("button", { name: "Arquivar" }));
    expect(arquivar).toHaveBeenCalledWith(LAZER, expect.anything());
  });
});
