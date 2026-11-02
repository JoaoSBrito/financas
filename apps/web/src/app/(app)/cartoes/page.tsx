import type { Metadata } from "next";
import { TelaCartoes } from "@/telas/cartoes/TelaCartoes";

export const metadata: Metadata = { title: "Cartões" };

export default function Pagina() {
  return <TelaCartoes />;
}
