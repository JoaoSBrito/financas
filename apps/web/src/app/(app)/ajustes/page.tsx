import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/componentes/TelaEmConstrucao";

export const metadata: Metadata = { title: "Ajustes" };

export default function Pagina() {
  return <TelaEmConstrucao titulo="Ajustes" />;
}
