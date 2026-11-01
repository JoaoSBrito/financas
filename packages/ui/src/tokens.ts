/**
 * Tokens de design puros (sem MUI), reaproveitáveis num futuro app Expo.
 * Contrastes conferidos para texto sobre fundo claro (mínimo 4,5:1).
 */
export const cores = {
  fundo: "#F3F4F6",
  superficie: "#FFFFFF",
  borda: "#E5E7EB",
  bordaForte: "#D1D5DB",
  texto: "#111827",
  textoSuave: "#4B5563",
  primaria: "#4338CA",
  primariaEscura: "#312E81",
  primariaClara: "#EEF2FF",
  primariaMedia: "#A5B4FC",
  destaque: "#1E1B4B",
  investimento: "#0F766E",
  investimentoEscuro: "#0F3D3A",
  investimentoClaro: "#CCFBF1",
  alerta: "#B45309",
  alertaClaro: "#FEF3C7",
  erro: "#B91C1C",
} as const;

export const raios = {
  pequeno: 8,
  medio: 14,
  card: 20,
  destaque: 24,
  pilula: 999,
} as const;

/** Espaçamento base de 4 px (o tema MUI usa spacing(n) = n × 4). */
export const espacoBase = 4;

/** Área mínima de toque. */
export const toqueMinimo = 44;

export const fonte = {
  familia: "var(--fonte-manrope), Manrope, system-ui, -apple-system, sans-serif",
  pesos: { regular: 400, medio: 500, semi: 600, negrito: 700, extra: 800 },
} as const;

export const breakpoints = { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } as const;
