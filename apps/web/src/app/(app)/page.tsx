import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/componentes/TelaEmConstrucao";

export const metadata: Metadata = { title: "Início" };

export default function Pagina() {
  return <TelaEmConstrucao titulo="Início" />;
}
