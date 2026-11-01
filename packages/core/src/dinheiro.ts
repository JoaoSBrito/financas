/** Todo valor em dinheiro é um número inteiro de centavos. */
export type Centavos = number;

export function reais(valor: number): Centavos {
  return Math.round(valor * 100);
}

/** Converte "1.234,56" ou "R$ 1.234,56" em centavos. */
export function lerValor(texto: string): Centavos {
  const limpo = texto.replace(/[^\d,-]/g, "").replace(",", ".");
  const n = Number(limpo);
  if (!Number.isFinite(n)) throw new Error(`Valor inválido: ${texto}`);
  return Math.round(n * 100);
}

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatar(c: Centavos): string {
  return formatador.format(c / 100);
}

/**
 * Divide um total em N parcelas inteiras.
 * A sobra de centavos vai para a primeira parcela, como fazem os bancos.
 */
export function dividirEmParcelas(total: Centavos, n: number): Centavos[] {
  if (!Number.isInteger(n) || n < 1) throw new Error("Número de parcelas inválido");
  const base = Math.floor(total / n);
  const sobra = total - base * n;
  return Array.from({ length: n }, (_, i) => (i === 0 ? base + sobra : base));
}
