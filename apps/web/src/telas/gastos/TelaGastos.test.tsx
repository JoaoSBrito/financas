import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Lancamento } from "@/services/faturas";
import type { MovimentoConta } from "@/services/contas";
import { usePreferencias } from "@/stores/preferencias";
import { TelaGastos } from "./TelaGastos";

const MERCADO = "2c9e2b6a-2222-4c2d-9e3f-0a1b2c3d4e5f";
const ELETRONICOS = "1c9e2b6a-1111-4c2d-9e3f-0a1b2c3d4e5f";

const lanc = (p: Partial<Lancamento>): Lancamento => ({
  id: crypto.randomUUID(), compraId: "c", faturaId: "f", cartaoId: "xp", numero: 1, totalParcelas: 1, valor: 1000,
  conferida: false, mes: "2026-11", descricao: "x", dataCompra: "2026-10-30", origem: "app", categoriaId: null, categoriaNome: null, ...p,
});
const saida = (p: Partial<MovimentoConta>): MovimentoConta => ({
  id: crypto.randomUUID(), contaId: "conta", data: "2026-11-05", descricao: "Pix", valor: -1000, tipo: "saida",
  recorrenteId: null, transferenciaId: null, categoriaId: null, entreContas: false, ...p,
});

// Notebook 10x de R$ 120 comprado em 20/07 (parcelas nas faturas de ago em diante).
const notebook = [5, 6].map((n) =>
  lanc({ compraId: "nb", descricao: "Notebook", numero: n, totalParcelas: 10, valor: 12000, dataCompra: "2026-07-20", mes: n === 5 ? "2026-12" : "2027-01", categoriaId: ELETRONICOS }),
);
const cartao = [
  ...notebook,
  lanc({ descricao: "Mercado", valor: 45000, dataCompra: "2026-11-02", mes: "2026-11", categoriaId: MERCADO }),
  lanc({ descricao: "Saldo inicial da fatura", valor: 64000, origem: "saldo_inicial", dataCompra: null }),
];
const conta = [
  saida({ descricao: "Pix feira", valor: -5000, categoriaId: MERCADO }),
  saida({ descricao: "Pix Ana", valor: -8000 }),
  // Outubro, para a comparação com o mês anterior.
  saida({ descricao: "Feira de outubro", data: "2026-10-10", valor: -40000, categoriaId: MERCADO }),
];

vi.mock("@/services/faturas", () => ({ listarLancamentosEntre: async () => cartao }));
vi.mock("@/services/contas", () => ({ listarSaidasEntre: async () => conta }));
vi.mock("@/hooks/useGastos", () => ({
  useCategorias: () => ({ isPending: false, data: [{ id: MERCADO, nome: "Mercado" }, { id: ELETRONICOS, nome: "Eletrônicos" }] }),
}));
vi.mock("@/hooks/useCartoes", () => ({ useCartoes: () => ({ data: [{ id: "xp", nome: "XP" }] }) }));
vi.mock("@/hooks/useContas", () => ({ useContas: () => ({ data: [{ id: "conta", nome: "Conta XP" }] }) }));

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-12T12:00:00-03:00"));
});
afterAll(() => vi.useRealTimers());

const normalizar = (t: string | null | undefined) => (t ?? "").replace(/\u00a0/g, " ");

async function renderizar() {
  const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query");
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TelaGastos />
    </QueryClientProvider>,
  );
}

/** Desktop (a partir de 900 px): o detalhe da categoria vai para o painel lateral. */
function simularDesktop(ativo: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: ativo
      ? (query: string) => ({ matches: /min-width:\s*900/.test(query), media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })
      : undefined,
  });
}
afterEach(() => simularDesktop(false));

const linha = (nome: RegExp) => normalizar(screen.getByRole("button", { name: nome }).textContent);

describe("TelaGastos", () => {
  it("pela data da compra: parcela do notebook conta em novembro (parcela 5 = jul + 4)", async () => {
    usePreferencias.setState({ baseGastos: "compra" });
    await renderizar();
    await screen.findByRole("region", { name: "Por categoria" });
    // Tabela: percentual, variação e valor (sem o "R$", que fica no total).
    expect(linha(/^Mercado/)).toBe("Mercado71%+25%500,00");
    expect(linha(/^Eletrônicos/)).toBe("Eletrônicos17%—120,00");
    expect(linha(/^Sem categoria/)).toBe("Sem categoriaCategorizar →80,00");
    // Saldo inicial da fatura fica de fora: 500 + 120 + 80.
    const total = screen.getByRole("region", { name: "Gasto em novembro" });
    expect(normalizar(total.textContent)).toContain("R$ 700,00");
  });

  it("compara o total com o mês anterior em barras e por escrito", async () => {
    usePreferencias.setState({ baseGastos: "compra" });
    await renderizar();
    const total = await screen.findByRole("region", { name: "Gasto em novembro" });
    expect(within(total).getByRole("img")).toHaveAccessibleName(/^novembro R\$\s700,00 contra outubro R\$\s400,00: aumento de 75%$/);
    expect(within(total).getByText("+75% em relação a outubro")).toBeInTheDocument();
    expect(screen.getByLabelText("Aumentou 25% em relação a outubro")).toBeInTheDocument();
  });

  it("pela data da fatura: a parcela de dezembro sai de novembro", async () => {
    usePreferencias.setState({ baseGastos: "fatura" });
    await renderizar();
    const lista = await screen.findByRole("region", { name: "Por categoria" });
    expect(normalizar(lista.textContent)).not.toContain("Eletrônicos");
  });

  it("no celular, tocar numa categoria abre a folha com cartão e conta juntos", async () => {
    usePreferencias.setState({ baseGastos: "compra" });
    const user = userEvent.setup();
    await renderizar();
    await screen.findByRole("region", { name: "Por categoria" });
    await user.click(screen.getByRole("button", { name: /^Mercado/ }));
    const dialogo = screen.getByRole("dialog", { name: "Mercado · novembro" });
    expect(within(dialogo).getByText("Cartão · 02/11 · XP · à vista")).toBeInTheDocument();
    expect(within(dialogo).getByText("Conta · 05/11 · Conta XP")).toBeInTheDocument();
  });

  it("no desktop, o detalhe fica no painel lateral e acompanha a linha escolhida", async () => {
    simularDesktop(true);
    usePreferencias.setState({ baseGastos: "compra" });
    const user = userEvent.setup();
    await renderizar();
    // Sem escolha, o painel mostra a maior categoria.
    const painel = await screen.findByRole("complementary", { name: "Mercado · novembro" });
    expect(within(painel).getByText("Cartão · 02/11 · XP · à vista")).toBeInTheDocument();
    const tabela = screen.getByRole("region", { name: "Por categoria" });
    expect(within(tabela).getByRole("button", { name: /^Mercado/ })).toHaveAttribute("aria-current", "true");

    await user.click(within(tabela).getByRole("button", { name: /^Eletrônicos/ }));
    expect(screen.getByRole("complementary", { name: "Eletrônicos · novembro" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
