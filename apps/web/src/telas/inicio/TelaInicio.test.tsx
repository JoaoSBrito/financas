import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { CartaoCompleto, FaturaResumo } from "@/services/cartoes-mapeamento";
import type { Lancamento } from "@/services/faturas";
import { TelaInicio } from "./TelaInicio";

const LAZER = "1c9e2b6a-1111-4c2d-9e3f-0a1b2c3d4e5f";
const MERCADO = "2c9e2b6a-2222-4c2d-9e3f-0a1b2c3d4e5f";

const xp: CartaoCompleto = {
  id: "xp",
  nome: "XP",
  final: "4821",
  limite: 800000,
  diaVencimento: 10,
  vencimentoNaoUtil: "proximo_dia_util",
  fechamento: { tipo: "dias_antes", dias: 5, contagem: "uteis" },
  avisarAntesDoFechamento: true,
  pedirConfirmacaoMensal: true,
};
const faturas: FaturaResumo[] = [
  { id: "f1", cartaoId: "xp", mes: "2026-11", fechamento: "2026-11-03", vencimento: "2026-11-10", status: "confirmado", pagaEm: null, total: 238490, lancamentos: 3, conferidos: 1 },
  { id: "f2", cartaoId: "xp", mes: "2026-12", fechamento: "2026-12-03", vencimento: "2026-12-10", status: "estimado", pagaEm: null, total: 130000, lancamentos: 1, conferidos: 0 },
];
const lanc = (categoriaId: string, valor: number): Lancamento => ({
  id: crypto.randomUUID(), compraId: "c", faturaId: "f1", cartaoId: "xp", numero: 1, totalParcelas: 1, valor,
  conferida: false, mes: "2026-11", descricao: "x", dataCompra: "2026-10-30", origem: "app", categoriaId, categoriaNome: null,
});

let cartoes = [xp];
vi.mock("@/hooks/useCartoes", () => ({ useCartoes: () => ({ isPending: false, isError: false, data: cartoes }) }));
vi.mock("@/hooks/useGastos", () => ({
  useFaturasResumo: () => ({ isPending: false, isError: false, data: faturas }),
  useCategorias: () => ({ isPending: false, isError: false, data: [{ id: LAZER, nome: "Lazer" }, { id: MERCADO, nome: "Mercado" }] }),
}));
vi.mock("@/hooks/useInicio", () => ({
  useLancamentosDoMes: () => ({ isPending: false, isError: false, data: [lanc(LAZER, 36800), lanc(MERCADO, 18640)] }),
  useOrcamentos: () => ({ isPending: false, isError: false, data: new Map([[LAZER, 40000]]) }),
  useComprasRecentes: () => ({
    isPending: false,
    isError: false,
    data: [{ id: "a", descricao: "Fone de ouvido", dataCompra: "2026-10-31", valorTotal: 120000, totalParcelas: 6, cartaoId: "xp", categoriaId: null }],
  }),
}));
vi.mock("next/dynamic", () => ({ default: () => () => <div data-testid="grafico" /> }));

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T12:00:00-03:00"));
});
afterAll(() => vi.useRealTimers());

const normalizar = (t: string | null | undefined) => (t ?? "").replace(/\u00a0/g, " ");

describe("TelaInicio", () => {
  it("mostra a fatura atual, o fechamento próximo e o limite real", () => {
    render(<TelaInicio />);
    const destaque = screen.getByRole("region", { name: "Fatura atual de todos os cartões" });
    const t = normalizar(destaque.textContent);
    expect(t).toContain("R$ 2.384,90");
    expect(t).toContain("XP fecha em 2 dias");
    expect(t).toContain("Melhor dia de compra: 04/11");
    expect(t).toContain("Disponível R$ 4.315,10");
  });

  it("alerta a categoria acima de 80% e lista as sem orçamento", () => {
    render(<TelaInicio />);
    const orcamento = screen.getByRole("region", { name: "Orçamento · fatura de novembro" });
    const t = normalizar(orcamento.textContent);
    expect(t).toContain("92% · R$ 368,00 de R$ 400,00");
    expect(t).toContain("Sem orçamento definido");
    expect(t).toContain("MercadoR$ 186,40");
  });

  it("lista os últimos gastos", () => {
    render(<TelaInicio />);
    expect(screen.getByText("Fone de ouvido")).toBeInTheDocument();
    expect(screen.getByText("31/10 · XP · 6x")).toBeInTheDocument();
  });

  it("sem cartões, convida a cadastrar", () => {
    cartoes = [];
    render(<TelaInicio />);
    expect(screen.getByText("Vamos começar pelo seu cartão")).toBeInTheDocument();
    cartoes = [xp];
  });
});
