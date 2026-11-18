/**
 * Contraste WCAG entre cores (puro, sem MUI). Usado nos testes dos tokens
 * e disponível para conferir combinações novas.
 */

type Rgb = [number, number, number];

function paraRgb(cor: string): Rgb {
  const hex = cor.trim().replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(`Cor inválida: ${cor}`);
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
}

function paraHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

/** Luminância relativa (WCAG 2.x). */
export function luminancia(cor: string): number {
  const [r, g, b] = paraRgb(cor).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste entre duas cores opacas (1 a 21). */
export function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return (claro + 0.05) / (escuro + 0.05);
}

/** Cor resultante de `cor` com opacidade `alfa` sobre `fundo` (para fundos rgba). */
export function misturar(cor: string, fundo: string, alfa: number): string {
  const c = paraRgb(cor);
  const f = paraRgb(fundo);
  return paraHex([0, 1, 2].map((i) => c[i]! * alfa + f[i]! * (1 - alfa)) as Rgb);
}
