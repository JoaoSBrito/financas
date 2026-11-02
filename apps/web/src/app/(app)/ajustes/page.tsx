import type { Metadata } from "next";
import { TelaAjustes } from "@/telas/ajustes/TelaAjustes";

export const metadata: Metadata = { title: "Ajustes" };

export default function Pagina() {
  return <TelaAjustes />;
}
