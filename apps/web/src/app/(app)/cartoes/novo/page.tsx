import type { Metadata } from "next";
import { TelaConfigurarCartao } from "@/telas/configurar-cartao/TelaConfigurarCartao";

export const metadata: Metadata = { title: "Novo cartão" };

export default function Pagina() {
  return <TelaConfigurarCartao />;
}
