import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/componentes/TelaEmConstrucao";

export const metadata: Metadata = { title: "Cartões e faturas" };

export default function Pagina() {
  return <TelaEmConstrucao titulo="Cartões e faturas" />;
}
