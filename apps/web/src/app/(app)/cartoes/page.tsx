import type { Metadata } from "next";
import { Suspense } from "react";
import { TelaFaturas } from "@/telas/faturas/TelaFaturas";

export const metadata: Metadata = { title: "Cartões e faturas" };

export default function Pagina() {
  // useSearchParams (cartão e mês na URL) precisa de um limite de Suspense.
  return (
    <Suspense>
      <TelaFaturas />
    </Suspense>
  );
}
