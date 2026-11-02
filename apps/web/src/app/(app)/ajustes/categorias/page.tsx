import type { Metadata } from "next";
import { TelaCategorias } from "@/telas/categorias/TelaCategorias";

export const metadata: Metadata = { title: "Categorias e orçamento" };

export default function Pagina() {
  return <TelaCategorias />;
}
