import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePreferencias } from "@/stores/preferencias";
import { TelaAjustes } from "./TelaAjustes";

const replace = vi.fn();
const signOut = vi.fn(async () => ({ error: null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({ supabaseNavegador: () => ({ auth: { signOut } }) }));

beforeEach(() => {
  replace.mockReset();
  signOut.mockClear();
  usePreferencias.setState({ ocultarValores: false });
});

describe("TelaAjustes", () => {
  it("mostra o e-mail da conta e os atalhos de organização", () => {
    render(<TelaAjustes email="voce@email.com" />);
    expect(within(screen.getByRole("region", { name: "Conta" })).getByText("voce@email.com")).toBeInTheDocument();
    const organizacao = screen.getByRole("region", { name: "Organização" });
    expect(within(organizacao).getByRole("link", { name: /^Categorias e orçamento/ })).toHaveAttribute("href", "/ajustes/categorias");
  });

  it("o interruptor liga e desliga o ocultar valores", async () => {
    const user = userEvent.setup();
    render(<TelaAjustes email="voce@email.com" />);
    const interruptor = screen.getByRole("switch", { name: /Ocultar valores/ });
    expect(interruptor).not.toBeChecked();
    await user.click(interruptor);
    expect(usePreferencias.getState().ocultarValores).toBe(true);
    expect(interruptor).toBeChecked();
  });

  it("sair encerra a sessão e volta para o login", async () => {
    const user = userEvent.setup();
    render(<TelaAjustes email={null} />);
    await user.click(screen.getByRole("button", { name: "Sair" }));
    expect(signOut).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/entrar");
  });
});
