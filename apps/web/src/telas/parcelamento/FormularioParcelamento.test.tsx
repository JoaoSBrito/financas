import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CartaoCompleto, FaturaResumo } from "@/services/cartoes-mapeamento";
import { FormularioParcelamento } from "./FormularioParcelamento";

const mutate = vi.fn();
vi.mock("@/hooks/useGastos", () => ({ useRegistrarParcelamento: () => ({ mutate, isPending: false, error: null }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const xp: CartaoCompleto = {
  id: "4b0c3a52-7f0f-4f53-9a5e-2f5b2c6d9e10", nome: "XP", final: null, limite: 800000, diaVencimento: 10,
  vencimentoNaoUtil: "proximo_dia_util", fechamento: { tipo: "dias_antes", dias: 5, contagem: "uteis" },
  avisarAntesDoFechamento: true, pedirConfirmacaoMensal: true,
};
const faturas: FaturaResumo[] = [
  { id: "f1", cartaoId: xp.id, mes: "2026-11", fechamento: "2026-11-03", vencimento: "2026-11-10", status: "confirmado", pagaEm: null, total: 184250, lancamentos: 2, conferidos: 0 },
  { id: "f2", cartaoId: xp.id, mes: "2026-12", fechamento: "2026-12-03", vencimento: "2026-12-10", status: "estimado", pagaEm: null, total: 0, lancamentos: 0, conferidos: 0 },
];

beforeEach(() => mutate.mockReset());
const normalizar = (t: string | null | undefined) => (t ?? "").replace(/\u00a0/g, " ");

function renderizar(hoje = "2026-11-01") {
  return render(<FormularioParcelamento cartoes={[xp]} categorias={[]} faturas={faturas} hoje={hoje} />);
}

async function preencher(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Descrição"), "Notebook");
  await user.type(screen.getByLabelText("Valor da parcela"), "100");
  for (let i = 0; i < 5; i++) await user.click(screen.getByRole("button", { name: "Aumentar parcela atual" }));
}

describe("FormularioParcelamento", () => {
  it("mostra a linha do tempo e o que será criado para 6 de 10", async () => {
    const user = userEvent.setup();
    renderizar();
    await preencher(user);
    expect(screen.getByText("Qual parcela vem na fatura de novembro?")).toBeInTheDocument();
    expect(screen.getByLabelText("Parcela 5, outubro de 2026, já paga")).toBeInTheDocument();
    expect(screen.getByLabelText("Parcela 6, novembro de 2026, na fatura escolhida")).toBeInTheDocument();
    expect(screen.getByLabelText("Parcela 10, março de 2027, futura")).toBeInTheDocument();
    const resumo = normalizar(screen.getByRole("region", { name: "O que será criado" }).textContent);
    expect(resumo).toContain("Parcelas a lançar5 · nov a mar");
    expect(resumo).toContain("Já pagas (só histórico)5");
    expect(resumo).toContain("Limite comprometidoR$ 500,00");
    expect(resumo).toContain("Fatura de novembro passa aR$ 1.942,50");
    expect(resumo).toContain("Valor total da compraR$ 1.000,00");
  });

  it("salva com a fatura de referência", async () => {
    const user = userEvent.setup();
    renderizar();
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Adicionar parcelamento" }));
    expect(mutate.mock.calls[0]![0]).toEqual({
      descricao: "Notebook",
      cartaoId: xp.id,
      categoriaId: null,
      valorParcela: 10000,
      totalParcelas: 10,
      parcelaAtual: 6,
      mesFatura: "2026-11",
    });
  });

  it("depois do fechamento, deixa escolher entre a fatura fechada e a aberta", async () => {
    const user = userEvent.setup();
    renderizar("2026-11-05");
    const grupo = screen.getByRole("group", { name: "Fatura de referência" });
    expect(within(grupo).getByRole("button", { name: "dezembro · aberta" })).toHaveAttribute("aria-pressed", "true");
    await user.click(within(grupo).getByRole("button", { name: "novembro · fechada" }));
    expect(screen.getByText("Qual parcela vem na fatura de novembro?")).toBeInTheDocument();
  });
});
