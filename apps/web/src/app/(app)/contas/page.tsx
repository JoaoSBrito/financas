import type { Metadata } from "next";
import { TelaContas } from "@/telas/contas/TelaContas";

export const metadata: Metadata = { title: "Contas e saldo" };

export default function Pagina() {
  return <TelaContas />;
}
