import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GraficoFaturas from "./GraficoFaturas";

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

describe("GraficoFaturas", () => {
  it("renderiza com um resumo acessível dos valores", () => {
    render(
      <GraficoFaturas
        meses={[
          { mes: "2026-11", total: 238490, aberta: true },
          { mes: "2026-12", total: 130000, aberta: false },
        ]}
      />,
    );
    const img = screen.getByRole("img", { name: /Próximas faturas/ });
    expect(img.getAttribute("aria-label")?.replace(/\u00a0/g, " ")).toBe(
      "Próximas faturas. novembro de 2026: R$ 2.384,90; dezembro de 2026: R$ 1.300,00.",
    );
  });
});
