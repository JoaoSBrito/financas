import { ThemeProvider } from "@mui/material/styles";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { tema } from "@financas/ui";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", () => ({ usePathname: () => "/cartoes" }));

/**
 * O jsdom não aplica media queries; então conferimos as regras CSS geradas
 * para cada navegação nos breakpoints do tema (sm = 600px, md = 900px).
 */
function css(): string {
  return [...document.querySelectorAll("style")].map((s) => s.textContent ?? "").join("\n").replace(/\s+/g, "");
}
function classe(el: Element): string {
  const c = [...el.classList].find((x) => x.startsWith("css-"));
  if (!c) throw new Error("sem classe do Emotion");
  return c;
}
function regra(el: Element, propriedade: string, minimo?: number): string | null {
  const c = classe(el);
  const texto = css();
  const alvo = minimo !== undefined
    ? new RegExp(`@media\\(min-width:${minimo}px\\)\\{\\.${c}\\{[^}]*${propriedade}:([^;}]+)`)
    : new RegExp(`(?:^|\\})\\.${c}\\{[^}]*${propriedade}:([^;}]+)`);
  return alvo.exec(texto)?.[1] ?? null;
}

function renderizar() {
  render(
    <ThemeProvider theme={tema}>
      <AppShell>
        <p>Conteúdo</p>
      </AppShell>
    </ThemeProvider>,
  );
  const [menu, barra] = screen.getAllByRole("navigation", { name: "Navegação principal" });
  return { menu: menu!, barra: barra! };
}

describe("navegação responsiva", () => {
  it("390px: só a barra inferior (o menu fica oculto)", () => {
    const { menu, barra } = renderizar();
    // Valores de xs viram regra base ou @media (min-width:0px), conforme o MUI.
    expect(regra(menu, "display") ?? regra(menu, "display", 0)).toBe("none");
    expect(regra(barra, "display") ?? regra(barra, "display", 0)).toBe("block");
  });

  it("600 a 899px: menu no topo e a barra inferior some", () => {
    const { menu, barra } = renderizar();
    expect(regra(menu, "display", 600)).toBe("flex");
    expect(regra(menu, "flex-direction", 600)).toBe("row");
    expect(regra(barra, "display", 600)).toBe("none");
  });

  it("900px em diante (inclui 1440px): menu lateral em coluna com largura fixa", () => {
    const { menu } = renderizar();
    expect(regra(menu, "flex-direction", 900)).toBe("column");
    expect(regra(menu, "width", 900)).toBe("264px");
  });

  it("item ativo marcado e botão central de novo gasto acessível", () => {
    const { barra } = renderizar();
    expect(within(barra).getByRole("link", { name: "Cartões" })).toHaveAttribute("aria-current", "page");
    expect(within(barra).getByRole("link", { name: "Novo gasto" })).toHaveAttribute("href", "/gastos/novo");
  });

  it("alvos de toque da barra com pelo menos 44px", () => {
    const { barra } = renderizar();
    for (const link of within(barra).getAllByRole("link")) {
      const alturas = [regra(link, "min-height"), regra(link, "height")].map((v) => parseInt(v ?? "0", 10));
      expect(Math.max(...alturas)).toBeGreaterThanOrEqual(44);
    }
  });
});
