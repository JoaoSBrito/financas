import type { Metadata } from "next";
import { TelaGastos } from "@/telas/gastos/TelaGastos";

export const metadata: Metadata = { title: "Gastos" };

export default function Pagina() {
  return <TelaGastos />;
}
