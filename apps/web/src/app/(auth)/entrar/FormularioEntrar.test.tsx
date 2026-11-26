import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormularioEntrar } from "./FormularioEntrar";

const entrar = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({ supabaseNavegador: () => ({ auth: { signInWithPassword: entrar } }) }));

describe("FormularioEntrar", () => {
  it("mostra e esconde a senha", async () => {
    const user = userEvent.setup();
    render(<FormularioEntrar />);
    const senha = screen.getByLabelText("Senha");
    expect(senha).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(senha).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Esconder senha" }));
    expect(senha).toHaveAttribute("type", "password");
  });

  it("avisa quando o e-mail ou a senha estão incorretos", async () => {
    entrar.mockResolvedValueOnce({ error: { message: "Invalid login" } });
    const user = userEvent.setup();
    render(<FormularioEntrar />);
    await user.type(screen.getByLabelText("E-mail"), "voce@email.com");
    await user.type(screen.getByLabelText("Senha"), "errada123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.");
  });
});
