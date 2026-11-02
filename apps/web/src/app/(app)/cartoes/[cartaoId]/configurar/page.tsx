import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { TelaConfigurarCartao } from "@/telas/configurar-cartao/TelaConfigurarCartao";

export const metadata: Metadata = { title: "Configurar cartão" };

export default async function Pagina({ params }: { params: Promise<{ cartaoId: string }> }) {
  const { cartaoId } = await params;
  if (!z.uuid().safeParse(cartaoId).success) notFound();
  return <TelaConfigurarCartao cartaoId={cartaoId} />;
}
