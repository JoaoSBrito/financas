import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import { ThemeProvider } from "@mui/material/styles";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { tema } from "../src/tema";
import { paleta, raio, toqueMinimo } from "../src/tokens";

const comTema = (ui: ReactNode) => render(<ThemeProvider theme={tema}>{ui}</ThemeProvider>);
/** O MUI usa variáveis CSS (ex.: --variant-containedBg); o jsdom não as resolve, então lemos a variável. */
const resolver = (estilo: CSSStyleDeclaration, valor: string) => {
  const m = /^var\((--[^)]+)\)$/.exec(valor.trim());
  return m ? estilo.getPropertyValue(m[1]!).trim() : valor;
};
const rgb = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

describe("tema Mercury", () => {
  it("é escuro e usa os tokens", () => {
    expect(tema.palette.mode).toBe("dark");
    expect(tema.palette.background.default).toBe(paleta.fundo);
    expect(tema.palette.background.paper).toBe(paleta.card);
    expect(tema.palette.primary.main).toBe(paleta.cobalto);
    expect(tema.palette.primary.contrastText).toBe(paleta.sobreCobalto);
    expect(tema.shape.borderRadius).toBe(raio.card);
  });

  it("títulos nunca passam do peso 500", () => {
    for (const v of ["h1", "h2", "h3", "subtitle1", "subtitle2", "button"] as const) {
      expect(Number(tema.typography[v].fontWeight)).toBeLessThanOrEqual(500);
    }
  });

  it("botão em pílula com área de toque mínima; cobalto só no contained", () => {
    comTema(
      <>
        <Button variant="contained">Salvar</Button>
        <Button variant="outlined">Cancelar</Button>
      </>,
    );
    const salvar = getComputedStyle(screen.getByRole("button", { name: "Salvar" }));
    const cancelar = getComputedStyle(screen.getByRole("button", { name: "Cancelar" }));
    expect(salvar.borderRadius).toBe(`${raio.pilula}px`);
    expect(salvar.minHeight).toBe(`${toqueMinimo}px`);
    expect([rgb(paleta.cobalto), paleta.cobalto]).toContain(resolver(salvar, salvar.backgroundColor));
    expect([rgb(paleta.texto), paleta.texto]).toContain(resolver(cancelar, cancelar.color));
  });

  it("card sem sombra, raio 12 e tom do card", () => {
    comTema(<Card data-testid="card">x</Card>);
    const card = getComputedStyle(screen.getByTestId("card"));
    expect(card.borderRadius).toBe("12px");
    expect(card.backgroundColor).toBe(rgb(paleta.card));
    expect(card.backgroundImage).toBe("none");
  });

  it("chip selecionado (primary) não usa cobalto", () => {
    comTema(<Chip color="primary" label="Mercado" />);
    const chip = getComputedStyle(screen.getByText("Mercado").parentElement!);
    expect(chip.backgroundColor).toBe(rgb(paleta.interativo));
  });

  it("barra de progresso fina com trilho interativo", () => {
    comTema(<LinearProgress variant="determinate" value={50} aria-label="x" />);
    const barra = getComputedStyle(screen.getByRole("progressbar"));
    expect(barra.height).toBe("4px");
    expect(barra.backgroundColor).toBe(rgb(paleta.interativo));
  });
});
