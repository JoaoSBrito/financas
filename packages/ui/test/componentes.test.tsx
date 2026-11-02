import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  BarraParcelas,
  CampoMoeda,
  ContadorNumerico,
  ProvedorOcultarValores,
  SeloStatus,
  Valor,
} from "../src";

// O Intl usa espaço não separável entre "R$" e o número.
const normalizar = (t: string | null) => (t ?? "").replace(/\u00a0/g, " ");

describe("Valor", () => {
  it("formata centavos em reais", () => {
    render(<Valor valor={184250} />);
    expect(normalizar(screen.getByText(/1\.842,50/).textContent)).toBe("R$ 1.842,50");
  });

  it("mostra sinal de + quando pedido", () => {
    render(<Valor valor={15230} sinal="sempre" />);
    expect(normalizar(screen.getByText(/152,30/).textContent)).toBe("+ R$ 152,30");
  });

  it("esconde o valor com 'ocultar valores' ligado", () => {
    render(
      <ProvedorOcultarValores oculto>
        <Valor valor={184250} />
      </ProvedorOcultarValores>,
    );
    expect(screen.getByLabelText("Valor oculto")).toBeInTheDocument();
    expect(screen.queryByText(/1\.842/)).not.toBeInTheDocument();
  });
});

describe("SeloStatus", () => {
  it("mostra o texto do status", () => {
    render(<SeloStatus status="estimado" />);
    expect(screen.getByText("Estimado")).toBeInTheDocument();
  });
});

describe("BarraParcelas", () => {
  it("descreve a parcela para leitores de tela", () => {
    render(<BarraParcelas total={10} atual={6} />);
    expect(screen.getByRole("img", { name: "Parcela 6 de 10" })).toBeInTheDocument();
  });
});

describe("ContadorNumerico", () => {
  it("respeita mínimo e máximo", async () => {
    const onChange = vi.fn();
    render(<ContadorNumerico valor={1} min={1} max={2} onChange={onChange} rotulo="Dias" />);
    expect(screen.getByRole("button", { name: "Diminuir dias" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Aumentar dias" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});

describe("CampoMoeda", () => {
  function Teste({ aoMudar }: { aoMudar: (v: number | null) => void }) {
    const [valor, setValor] = useState<number | null>(null);
    return (
      <CampoMoeda
        label="Valor"
        valor={valor}
        onChange={(v) => {
          setValor(v);
          aoMudar(v);
        }}
      />
    );
  }

  it("entrega centavos inteiros", async () => {
    const aoMudar = vi.fn();
    render(<Teste aoMudar={aoMudar} />);
    await userEvent.type(screen.getByLabelText("Valor"), "1200,5");
    expect(aoMudar).toHaveBeenLastCalledWith(120050);
  });
});

import { ItemFaturaFutura } from "../src";

describe("ItemFaturaFutura", () => {
  it("mostra datas, selo e botão de correção acessível", async () => {
    const onCorrigir = vi.fn();
    render(
      <ItemFaturaFutura
        fechamento="2027-01-04"
        vencimento="2027-01-11"
        status="estimado"
        observacao="dia 10 é domingo"
        nomeMes="janeiro"
        onCorrigir={onCorrigir}
      />,
    );
    expect(screen.getByText("Fecha 04/01")).toBeInTheDocument();
    expect(screen.getByText("Vence 11/01 · dia 10 é domingo")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Corrigir datas da fatura de janeiro" }));
    expect(onCorrigir).toHaveBeenCalled();
  });
});
