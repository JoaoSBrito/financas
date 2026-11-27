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
    expect(tema.palette.background.paper).toBe(paleta.painel);
    expect(tema.palette.primary.main).toBe(paleta.acao);
    expect(tema.palette.primary.contrastText).toBe(paleta.sobreAcao);
    expect(tema.shape.borderRadius).toBe(raio.painel);
  });

  it("títulos até peso 500; só o botão usa 600", () => {
    for (const v of ["h1", "h2", "h3", "subtitle1", "subtitle2"] as const) {
      expect(Number(tema.typography[v].fontWeight)).toBeLessThanOrEqual(500);
    }
    expect(Number(tema.typography.button.fontWeight)).toBe(600);
  });

  it("botão com raio de controle e área de toque mínima; lima só no contained", () => {
    comTema(
      <>
        <Button variant="contained">Salvar</Button>
        <Button variant="outlined">Cancelar</Button>
      </>,
    );
    const salvar = getComputedStyle(screen.getByRole("button", { name: "Salvar" }));
    const cancelar = getComputedStyle(screen.getByRole("button", { name: "Cancelar" }));
    expect(salvar.borderRadius).toBe(`${raio.controle}px`);
    expect(salvar.minHeight).toBe(`${toqueMinimo}px`);
    expect([rgb(paleta.acao), paleta.acao]).toContain(resolver(salvar, salvar.backgroundColor));
    expect([rgb(paleta.texto), paleta.texto]).toContain(resolver(cancelar, cancelar.color));
  });

  it("painel sem sombra, raio 10, borda de 1 px e tom do painel", () => {
    comTema(<Card data-testid="card">x</Card>);
    const card = getComputedStyle(screen.getByTestId("card"));
    expect(card.borderRadius).toBe(`${raio.painel}px`);
    expect(card.backgroundColor).toBe(rgb(paleta.painel));
    expect(card.borderTopWidth).toBe("1px");
    expect(card.borderTopColor).toBe(rgb(paleta.divisor));
    expect(card.backgroundImage).toBe("none");
  });

  it("filtro selecionado (chip primary) é pílula clara com texto escuro, sem lima", () => {
    comTema(<Chip color="primary" label="Mercado" />);
    const chip = getComputedStyle(screen.getByText("Mercado").parentElement!);
    expect(chip.backgroundColor).toBe(rgb(paleta.texto));
    expect(chip.color).toBe(rgb(paleta.sobreAcao));
  });

  it("barra de progresso reta de 4 px sobre o trilho do divisor", () => {
    comTema(<LinearProgress variant="determinate" value={50} aria-label="x" />);
    const barra = getComputedStyle(screen.getByRole("progressbar"));
    expect(barra.height).toBe("4px");
    expect(barra.backgroundColor).toBe(rgb(paleta.divisor));
    expect(barra.borderRadius).toBe("0px");
  });
});
