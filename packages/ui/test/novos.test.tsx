import { ThemeProvider } from "@mui/material/styles";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  BarraSegmentada,
  CabecalhoTela,
  CartaoFisico,
  FolhaInferior,
  IconeCaixinha,
  ItemLinhaDoTempo,
  ItemMovimento,
  LogoLastro,
  ReguaCobertura,
  Rotulo,
  SeletorCategoria,
} from "../src";
import { tema } from "../src/tema";

const comTema = (ui: ReactNode) => render(<ThemeProvider theme={tema}>{ui}</ThemeProvider>);
const normalizar = (t: string | null | undefined) => (t ?? "").replace(/\u00a0/g, " ");

describe("BarraSegmentada", () => {
  it("divide os blocos pelos segmentos e deixa o resto no trilho", () => {
    comTema(
      <BarraSegmentada
        rotulo="Limite: 30% fatura, 15% parcelas"
        total={100}
        segmentos={[
          { rotulo: "Fatura", valor: 30, cor: "#E8EAED" },
          { rotulo: "Parcelas", valor: 15, cor: "#6B727C" },
        ]}
        legenda
        rotuloRestante="Livre"
      />,
    );
    const barra = screen.getByRole("img", { name: "Limite: 30% fatura, 15% parcelas" });
    expect(barra.children).toHaveLength(20);
    expect(screen.getByText("Livre")).toBeInTheDocument();
  });
});

describe("ReguaCobertura", () => {
  it("um bloco por mês, com rótulo acessível", () => {
    comTema(<ReguaCobertura coberto={2.9} meses={6} rotulo="Cobre 2,9 de 6 meses" />);
    expect(screen.getByRole("img", { name: "Cobre 2,9 de 6 meses" }).children).toHaveLength(6);
  });
});

describe("CartaoFisico", () => {
  it("vira opção de seleção quando recebe onSelecionar", async () => {
    const aoSelecionar = vi.fn();
    comTema(<CartaoFisico nome="XP" final="4821" cor="#8FB8FF" fundo="#18202E" percentualUso={46} onSelecionar={aoSelecionar} />);
    const opcao = screen.getByRole("radio", { name: "XP" });
    expect(opcao).toHaveAttribute("aria-checked", "false");
    await userEvent.click(opcao);
    expect(aoSelecionar).toHaveBeenCalled();
    expect(normalizar(opcao.textContent)).toContain("•••• 4821");
  });

  it("sem seleção, é uma imagem descrita", () => {
    comTema(<CartaoFisico nome="Viagens" final="1173" cor="#D7A4FF" fundo="#211A28" />);
    expect(screen.getByRole("img", { name: "Cartão Viagens, final 1173" })).toBeInTheDocument();
  });
});

describe("linhas", () => {
  it("ItemLinhaDoTempo mostra data, evento e o fim", () => {
    comTema(
      <ol>
        <ItemLinhaDoTempo data="03/12" tipo="fechamento" cor="#8FB8FF" titulo="Fechamento XP" fim={<span>Estimado</span>} />
      </ol>,
    );
    expect(normalizar(screen.getByRole("listitem").textContent)).toBe("03/12Fechamento XPEstimado");
  });

  it("ItemMovimento mostra o sinal e o saldo após", () => {
    comTema(<ItemMovimento descricao="Salário" detalhe="05/11 · recorrente" valor={520000} saldoApos={835000} />);
    expect(normalizar(document.body.textContent)).toContain("Salário05/11 · recorrente+ R$ 5.200,00R$ 8.350,00");
  });
});

describe("CabecalhoTela e Rotulo", () => {
  it("título como h1 com voltar e ação", () => {
    comTema(<CabecalhoTela titulo="Gastos" voltar={<button aria-label="Voltar" />} acao={<button>+ Nova</button>} />);
    expect(screen.getByRole("heading", { level: 1, name: "Gastos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
  });

  it("rótulo mantém o texto normal no DOM (caixa alta é só visual)", () => {
    comTema(<Rotulo>Limite livre</Rotulo>);
    expect(screen.getByText("Limite livre")).toBeInTheDocument();
  });
});

describe("FolhaInferior", () => {
  it("abre com título acessível, contexto e ações; fecha pelo botão", async () => {
    const aoFechar = vi.fn();
    comTema(
      <FolhaInferior aberta onFechar={aoFechar} titulo="Pagar fatura" contexto="XP · fatura de novembro" acoes={<button>Registrar pagamento</button>}>
        <p>Conteúdo</p>
      </FolhaInferior>,
    );
    const dialogo = screen.getByRole("dialog", { name: "Pagar fatura" });
    expect(within(dialogo).getByText("XP · fatura de novembro")).toBeInTheDocument();
    expect(within(dialogo).getByRole("button", { name: "Registrar pagamento" })).toBeInTheDocument();
    await userEvent.click(within(dialogo).getByRole("button", { name: "Fechar" }));
    expect(aoFechar).toHaveBeenCalled();
  });
});

describe("SeletorCategoria", () => {
  const opcoes = [
    { id: "o", nome: "Outros" },
    { id: "m", nome: "Mercado" },
    { id: "a", nome: "Alimentação" },
  ];

  it("ordena em ordem alfabética com Outros no fim e começa em Sem categoria", () => {
    comTema(<SeletorCategoria opcoes={opcoes} valor={null} onChange={() => {}} />);
    const nomes = within(screen.getByLabelText("Categoria")).getAllByRole("option").map((o) => o.textContent);
    expect(nomes).toEqual(["Sem categoria", "Alimentação", "Mercado", "Outros"]);
  });

  it("devolve o id escolhido e null para Sem categoria", async () => {
    const aoMudar = vi.fn();
    comTema(<SeletorCategoria opcoes={opcoes} valor="m" onChange={aoMudar} />);
    await userEvent.selectOptions(screen.getByLabelText("Categoria"), "Alimentação");
    expect(aoMudar).toHaveBeenLastCalledWith("a");
    await userEvent.selectOptions(screen.getByLabelText("Categoria"), "Sem categoria");
    expect(aoMudar).toHaveBeenLastCalledWith(null);
  });
});

describe("marca", () => {
  it("logo com nome e ícone de caixinha", () => {
    comTema(
      <>
        <LogoLastro />
        <IconeCaixinha data-testid="porquinho" />
      </>,
    );
    expect(screen.getByText("LASTRO")).toBeInTheDocument();
    expect(screen.getByTestId("porquinho").tagName.toLowerCase()).toBe("svg");
  });
});
