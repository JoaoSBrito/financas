import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CartaoCompleto, FaturaResumo } from "@/services/cartoes-mapeamento";
import { FormularioGasto } from "./FormularioGasto";

const mutate = vi.fn();
vi.mock("@/hooks/useGastos", () => ({
  useRegistrarGasto: () => ({ mutate, isPending: false, error: null }),
}));

const base = { avisarAntesDoFechamento: true, pedirConfirmacaoMensal: true, final: null } as const;
const xp: CartaoCompleto = {
  ...base,
  id: "4b0c3a52-7f0f-4f53-9a5e-2f5b2c6d9e10",
  nome: "XP",
  limite: 800000,
  diaVencimento: 10,
  vencimentoNaoUtil: "proximo_dia_util",
  fechamento: { tipo: "dias_antes", dias: 5, contagem: "uteis" },
};
const viagens: CartaoCompleto = {
  ...base,
  id: "9d1f6a10-2b3c-4d5e-8f70-112233445566",
  nome: "Viagens",
  limite: 200000,
  diaVencimento: 28,
  vencimentoNaoUtil: "proximo_dia_util",
  fechamento: { tipo: "dia_fixo", dia: 20 },
};
const faturas: FaturaResumo[] = [
  {
    id: "f1",
    cartaoId: xp.id,
    mes: "2026-11",
    fechamento: "2026-11-03",
    vencimento: "2026-11-10",
    status: "confirmado",
    pagaEm: null,
    total: 184250,
    lancamentos: 3,
    conferidos: 1,
  },
];
const categorias = [
  { id: "1c9e2b6a-1111-4c2d-9e3f-0a1b2c3d4e5f", nome: "Eletrônicos" },
  { id: "2c9e2b6a-2222-4c2d-9e3f-0a1b2c3d4e5f", nome: "Mercado" },
];

beforeEach(() => mutate.mockReset());

function renderizar() {
  return render(
    <FormularioGasto cartoes={[xp, viagens]} categorias={categorias} faturas={faturas} hoje="2026-11-01" onConcluir={vi.fn()} />,
  );
}

const normalizar = (t: string | null | undefined) => (t ?? "").replace(/\u00a0/g, " ");

describe("FormularioGasto", () => {
  it("sugere o cartão com mais prazo e já o seleciona", () => {
    renderizar();
    const viagensOpcao = screen.getByRole("radio", { name: /Viagens/ });
    expect(viagensOpcao).toHaveAttribute("aria-checked", "true");
    expect(within(viagensOpcao).getByText("Melhor hoje · Paga em 30/11")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /XP/ })).toHaveTextContent("Paga em 10/11");
  });

  it("mostra o impacto de 6x no XP antes de salvar", async () => {
    const user = userEvent.setup();
    renderizar();
    await user.type(screen.getByLabelText("Valor total"), "1200");
    await user.click(screen.getByRole("radio", { name: /XP/ }));
    await user.click(screen.getByRole("button", { name: "6x" }));
    const impacto = screen.getByRole("region", { name: "Impacto nas faturas" });
    expect(normalizar(impacto.textContent)).toContain("R$ 200,00 · nov a abr");
    expect(normalizar(impacto.textContent)).toContain("Fatura de novembro passa aR$ 2.042,50");
    expect(normalizar(impacto.textContent)).toContain("Limite disponível depoisR$ 4.957,50");
  });

  it("salva com centavos e parcelas", async () => {
    const user = userEvent.setup();
    renderizar();
    await user.type(screen.getByLabelText("Valor total"), "1200");
    await user.type(screen.getByLabelText("Descrição"), "Fone de ouvido");
    await user.click(screen.getByRole("radio", { name: /XP/ }));
    await user.click(screen.getByRole("button", { name: "Eletrônicos" }));
    await user.click(screen.getByRole("button", { name: "6x" }));
    await user.click(screen.getByRole("button", { name: "Salvar gasto" }));
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0]![0]).toEqual({
      valor: 120000,
      descricao: "Fone de ouvido",
      cartaoId: xp.id,
      categoriaId: categorias[0]!.id,
      dataCompra: "2026-11-01",
      parcelas: 6,
    });
  });

  it("não salva sem valor e sem descrição", async () => {
    const user = userEvent.setup();
    renderizar();
    await user.click(screen.getByRole("button", { name: "Salvar gasto" }));
    expect(await screen.findByText("O valor precisa ser maior que zero")).toBeInTheDocument();
    expect(screen.getByText("Informe uma descrição")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });
});

describe("FormularioGasto com compra antiga", () => {
  it("marca as parcelas de faturas vencidas como histórico", async () => {
    const user = userEvent.setup();
    renderizar();
    await user.type(screen.getByLabelText("Valor total"), "1000");
    await user.click(screen.getByRole("radio", { name: /XP/ }));
    const data = screen.getByLabelText("Data da compra");
    await user.clear(data);
    await user.type(data, "2026-06-15");
    await user.click(screen.getByRole("button", { name: "10x" }));
    const impacto = screen.getByRole("region", { name: "Impacto nas faturas" });
    expect(normalizar(impacto.textContent)).toContain("Já pagas (só histórico)4 de 10");
    expect(normalizar(impacto.textContent)).toContain("Primeira no appparcela 5 em novembro");
    expect(normalizar(impacto.textContent)).toContain("Fatura de novembro passa aR$ 1.942,50");
  });
});
