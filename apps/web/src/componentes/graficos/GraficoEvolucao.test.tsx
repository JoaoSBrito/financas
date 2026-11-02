import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GraficoEvolucao from "./GraficoEvolucao";

vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });

describe("GraficoEvolucao", () => {
  it("renderiza com resumo acessível", () => {
    render(<GraficoEvolucao pontos={[{ mes: "2026-10", total: 1200000 }, { mes: "2026-11", total: 1215230 }]} />);
    expect(screen.getByRole("img", { name: /Evolução do patrimônio\. outubro de 2026/ })).toBeInTheDocument();
  });
});
