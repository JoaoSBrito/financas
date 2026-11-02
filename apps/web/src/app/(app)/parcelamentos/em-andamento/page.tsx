import type { Metadata } from "next";
import { Suspense } from "react";
import { TelaParcelamento } from "@/telas/parcelamento/TelaParcelamento";

export const metadata: Metadata = { title: "Parcelamento em andamento" };

export default function Pagina() {
  return (
    <Suspense>
      <TelaParcelamento />
    </Suspense>
  );
}
