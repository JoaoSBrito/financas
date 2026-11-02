import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { CartaoCompleto, FaturaResumo } from "@/services/cartoes-mapeamento";
import type { Lancamento } from "@/services/faturas";
import { TelaFaturas } from "./TelaFaturas";

const conferir = vi.fn();
const pagar = vi.fn();
const editar = vi.fn();

const xp: CartaoCompleto = {
  id: "4b0c3a52-7f0f-4f53-9a5e-2f5b2c6d9e10",
  nome: "XP",
  final: "4821",
  limite: 800000,
  diaVencimento: 10,
  vencimentoNaoUtil: "proximo_dia_util",
  fechamento: { tipo: "dias_antes", dias: 5, contagem: "uteis" },
  avisarAntesDoFechamento: true,
  pedirConfirmacaoMensal: true,
};
const fatura = (mes: string, fechamento: string, vencimento: string, total: number, status: FaturaResumo["status"] = "estimado"): FaturaResumo => ({
  id: `f-${mes}`,
  cartaoId: xp.id,
  mes,
  fechamento,
  vencimento,
  status,
  pagaEm: null,
  total,
  lancamentos: 0,
  conferidos: 0,
});
const faturas = [
  fatura("2026-11", "2026-11-03", "2026-11-10", 28640, "confirmado"),
  fatura("2026-12", "2026-12-03", "2026-12-10", 10000),
  fatura("2027-01", "2027-01-04", "2027-01-11", 10000),
];
const lanc = (p: Partial<Lancamento>): Lancamento => ({
  id: crypto.randomUUID(),
  compraId: "c",
  faturaId: "f-2026-11",
  cartaoId: xp.id,
  numero: 1,
  totalParcelas: 1,
  valor: 1000,
  conferida: false,
  mes: "2026-11",
  descricao: "X",
  dataCompra: "2026-10-30",
  origem: "app",
  categoriaId: null,
  categoriaNome: null,
  ...p,
});
const lancamentos = [
  lanc({ compraId: "m", descricao: "Mercado", valor: 18640, conferida: true, categoriaNome: "Mercado" }),
  lanc({ compraId: "nb", descricao: "Notebook", numero: 6, totalParcelas: 10, valor: 10000, dataCompra: "2026-06-15" }),
  lanc({ compraId: "nb", descricao: "Notebook", numero: 7, totalParcelas: 10, valor: 10000, mes: "2026-12", faturaId: "f-2026-12", dataCompra: "2026-06-15" }),
];

vi.mock("@/hooks/useCartoes", () => ({
  useCartoes: () => ({ isPending: false, isError: false, data: [xp] }),
  useCorrigirFatura: () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null }),
}));
vi.mock("@/hooks/useGastos", () => ({
  useFaturasResumo: () => ({ isPending: false, isError: false, data: faturas }),
  useCategorias: () => ({ data: [{ id: "1c9e2b6a-1111-4c2d-9e3f-0a1b2c3d4e5f", nome: "Eletrônicos" }] }),
}));
vi.mock("@/hooks/useFaturas", () => ({
  useLancamentos: () => ({ isPending: false, isError: false, data: lancamentos }),
  useMarcarConferida: () => ({ mutate: conferir }),
  useMarcarFaturaPaga: () => ({ mutate: pagar, isPending: false }),
  useEditarCompra: () => ({ mutate: editar, isPending: false, error: null }),
  useExcluirCompra: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/cartoes",
  useSearchParams: () => new URLSearchParams(),
}));

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T12:00:00-03:00"));
});
afterAll(() => vi.useRealTimers());
beforeEach(() => {
  conferir.mockReset();
  pagar.mockReset();
  editar.mockReset();
});

const normalizar = (t: string | null | undefined) => (t ?? "").replace(/\u00a0/g, " ");

describe("TelaFaturas", () => {
  it("abre na fatura aberta com a divisão e a conferência", () => {
    render(<TelaFaturas />);
    expect(screen.getByRole("button", { name: "Fatura de novembro de 2026, aberta" })).toHaveAttribute("aria-pressed", "true");
    const resumo = screen.getByRole("region", { name: "Fatura de novembro de 2026" });
    const texto = normalizar(resumo.textContent);
    expect(texto).toContain("R$ 286,40");
    expect(texto).toContain("À vistaR$ 186,40");
    expect(texto).toContain("ParcelasR$ 100,00");
    expect(texto).toContain("1 de 2");
  });

  it("filtra os não conferidos", async () => {
    const user = userEvent.setup();
    render(<TelaFaturas />);
    await user.click(screen.getByRole("button", { name: "Não conferidos" }));
    const lista = screen.getByRole("region", { name: "Lançamentos" });
    expect(within(lista).queryAllByText("Mercado")).toHaveLength(0);
    expect(within(lista).getAllByText("Notebook").length).toBeGreaterThan(0);
  });

  it("marca um lançamento como conferido", async () => {
    const user = userEvent.setup();
    render(<TelaFaturas />);
    await user.click(screen.getAllByRole("checkbox", { name: "Conferido: Notebook" })[0]!);
    expect(conferir).toHaveBeenCalledWith({ id: lancamentos[1]!.id, conferida: true });
  });

  it("mostra o parcelamento ativo", () => {
    render(<TelaFaturas />);
    const parcelamentos = screen.getByRole("region", { name: "Parcelamentos ativos" });
    expect(normalizar(parcelamentos.textContent)).toContain("6 de 10 · termina em dez/26 · faltam R$ 200,00");
  });

  it("marca a fatura como paga com a data de hoje", async () => {
    const user = userEvent.setup();
    render(<TelaFaturas />);
    await user.click(screen.getByRole("button", { name: "Marcar como paga" }));
    expect(pagar).toHaveBeenCalledWith({ faturaId: "f-2026-11", pagaEm: "2026-11-01" });
  });

  it("edita descrição e categoria de um gasto", async () => {
    const user = userEvent.setup();
    render(<TelaFaturas />);
    await user.click(screen.getAllByRole("button", { name: "Editar Mercado" })[0]!);
    const dialogo = screen.getByRole("dialog");
    const campo = within(dialogo).getByLabelText("Descrição");
    await user.clear(campo);
    await user.type(campo, "Supermercado");
    await user.click(within(dialogo).getByRole("button", { name: "Eletrônicos" }));
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }));
    expect(editar.mock.calls[0]![0]).toEqual({
      compraId: "m",
      descricao: "Supermercado",
      categoriaId: "1c9e2b6a-1111-4c2d-9e3f-0a1b2c3d4e5f",
    });
  });
});
