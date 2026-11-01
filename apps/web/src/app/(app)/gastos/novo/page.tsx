import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/componentes/TelaEmConstrucao";

export const metadata: Metadata = { title: "Novo gasto" };

export default function Pagina() {
  return <TelaEmConstrucao titulo="Novo gasto" />;
}
