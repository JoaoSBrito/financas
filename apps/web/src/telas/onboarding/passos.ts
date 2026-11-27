export const PASSOS = [
  {
    slug: "cartao",
    nome: "Cartão",
    titulo: "Cadastre seu primeiro cartão",
    descricao: "Com a regra de fechamento, o app calcula em que fatura cada compra cai.",
  },
  {
    slug: "parcelamentos",
    nome: "Parcelas",
    titulo: "O que você já tem parcelado?",
    descricao: "Lance as compras que ainda têm parcelas a cobrar. Só as que faltam entram nas faturas.",
  },
  {
    slug: "fatura",
    nome: "Fatura",
    titulo: "Quanto já está na fatura aberta?",
    descricao: "Gastos feitos antes de usar o app que ainda vão cair nesta fatura.",
  },
  { slug: "pronto", nome: "Pronto", titulo: "Tudo pronto", descricao: "Confira o que foi configurado. Dá para ajustar depois em Ajustes." },
] as const;

export type SlugPasso = (typeof PASSOS)[number]["slug"];

export function ehPasso(s: string): s is SlugPasso {
  return PASSOS.some((p) => p.slug === s);
}
