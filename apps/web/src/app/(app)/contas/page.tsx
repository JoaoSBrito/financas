import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/componentes/TelaEmConstrucao";

export const metadata: Metadata = { title: "Contas e saldo" };

export default function Pagina() {
  return <TelaEmConstrucao titulo="Contas e saldo" />;
}
