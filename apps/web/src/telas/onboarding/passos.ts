export const PASSOS = [
  { slug: "cartao", nome: "Cartão", titulo: "Cadastre seu cartão", descricao: "Com a regra de fechamento, o app sabe em qual fatura cada gasto cai." },
  {
    slug: "parcelamentos",
    nome: "Parcelamentos",
    titulo: "O que você já tem parcelado?",
    descricao: "Lance as compras que ainda têm parcelas a cobrar. Só as que faltam entram nas próximas faturas.",
  },
  {
    slug: "fatura",
    nome: "Fatura aberta",
    titulo: "Quanto já tem na fatura?",
    descricao: "Informe o que já gastou à vista neste ciclo, como um valor único ou lançando um a um.",
  },
  { slug: "pronto", nome: "Pronto", titulo: "Tudo pronto", descricao: "Agora é só lançar os gastos do dia a dia." },
] as const;

export type SlugPasso = (typeof PASSOS)[number]["slug"];

export function ehPasso(s: string): s is SlugPasso {
  return PASSOS.some((p) => p.slug === s);
}
