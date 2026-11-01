import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/componentes/TelaEmConstrucao";

export const metadata: Metadata = { title: "Caixinhas e investimentos" };

export default function Pagina() {
  return <TelaEmConstrucao titulo="Caixinhas e investimentos" />;
}
