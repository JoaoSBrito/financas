import type { Metadata } from "next";
import { TelaCaixinhas } from "@/telas/caixinhas/TelaCaixinhas";

export const metadata: Metadata = { title: "Caixinhas e investimentos" };

export default function Pagina() {
  return <TelaCaixinhas />;
}
