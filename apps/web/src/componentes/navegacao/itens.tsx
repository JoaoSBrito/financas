import AccountBalanceWalletRounded from "@mui/icons-material/AccountBalanceWalletRounded";
import CreditCardRounded from "@mui/icons-material/CreditCardRounded";
import HomeRounded from "@mui/icons-material/HomeRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import type { ReactNode } from "react";

export interface ItemNavegacao {
  href: string;
  rotulo: string;
  /** Rótulo mais longo no menu lateral do desktop. */
  rotuloLongo: string;
  icone: ReactNode;
  /** Aparece na barra inferior do celular. */
  noCelular: boolean;
}

export const ITENS_NAVEGACAO: ItemNavegacao[] = [
  { href: "/", rotulo: "Início", rotuloLongo: "Início", icone: <HomeRounded />, noCelular: true },
  { href: "/contas", rotulo: "Contas", rotuloLongo: "Contas e saldo", icone: <AccountBalanceWalletRounded />, noCelular: true },
  { href: "/cartoes", rotulo: "Cartões", rotuloLongo: "Cartões e faturas", icone: <CreditCardRounded />, noCelular: true },
  { href: "/caixinhas", rotulo: "Investir", rotuloLongo: "Investimentos", icone: <TrendingUpRounded />, noCelular: true },
  { href: "/ajustes", rotulo: "Ajustes", rotuloLongo: "Ajustes", icone: <SettingsRounded />, noCelular: false },
];

export function estaAtivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
