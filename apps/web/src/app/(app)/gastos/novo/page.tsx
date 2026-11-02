import type { Metadata } from "next";
import { PaginaNovoGasto } from "@/telas/novo-gasto/PaginaNovoGasto";

export const metadata: Metadata = { title: "Novo gasto" };

export default function Pagina() {
  return <PaginaNovoGasto />;
}
