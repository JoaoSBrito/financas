import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TelaOnboarding } from "@/telas/onboarding/TelaOnboarding";
import { ehPasso } from "@/telas/onboarding/passos";

export const metadata: Metadata = { title: "Primeiros passos" };

export default async function Pagina({ params }: { params: Promise<{ passo: string }> }) {
  const { passo } = await params;
  if (!ehPasso(passo)) notFound();
  return <TelaOnboarding passo={passo} />;
}
