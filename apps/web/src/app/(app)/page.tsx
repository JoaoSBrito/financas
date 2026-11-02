import type { Metadata } from "next";
import { TelaInicio } from "@/telas/inicio/TelaInicio";

export const metadata: Metadata = { title: "Início" };

export default function Pagina() {
  return <TelaInicio />;
}
