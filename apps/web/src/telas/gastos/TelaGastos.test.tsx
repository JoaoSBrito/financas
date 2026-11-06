import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
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
const conta = [saida({ descricao: "Pix feira", valor: -5000, categoriaId: MERCADO }), saida({ descricao: "Pix Ana", valor: -8000 })];

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

describe("TelaGastos", () => {
  it("pela data da compra: parcela do notebook conta em novembro (parcela 5 = jul + 4)", async () => {
    usePreferencias.setState({ baseGastos: "compra" });
    await renderizar();
    const lista = await screen.findByRole("region", { name: "Por categoria" });
    const t = normalizar(lista.textContent);
    expect(t).toContain("MercadoR$ 500,00");
    expect(t).toContain("EletrônicosR$ 120,00");
    expect(t).toContain("Sem categoriaR$ 80,00");
    // Saldo inicial da fatura fica de fora: 500 + 120 + 80.
    expect(normalizar(document.body.textContent)).toContain("R$ 700,00");
  });

  it("pela data da fatura: a parcela de dezembro sai de novembro", async () => {
    usePreferencias.setState({ baseGastos: "fatura" });
    await renderizar();
    const lista = await screen.findByRole("region", { name: "Por categoria" });
    expect(normalizar(lista.textContent)).not.toContain("Eletrônicos");
  });

  it("tocar numa categoria lista cartão e conta juntos", async () => {
    usePreferencias.setState({ baseGastos: "compra" });
    const user = userEvent.setup();
    await renderizar();
    await screen.findByRole("region", { name: "Por categoria" });
    await user.click(screen.getByRole("button", { name: /^Mercado/ }));
    const dialogo = screen.getByRole("dialog", { name: "Mercado · novembro" });
    expect(within(dialogo).getByText("Cartão · 02/11 · XP · à vista")).toBeInTheDocument();
    expect(within(dialogo).getByText("Conta · 05/11 · Conta XP")).toBeInTheDocument();
  });
});
