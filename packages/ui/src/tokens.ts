/**
 * Tokens de design puros (sem MUI), reaproveitáveis num futuro app Expo.
 *
 * Visual "Mercury": tema escuro, sem sombras. A profundidade vem só da diferença
 * de tom entre fundo → card → superfície interativa. O cobalto marca uma única
 * ação principal por tela. Cores semânticas são dessaturadas e aparecem só em
 * texto, pontos e barras finas, nunca em grandes áreas.
 *
 * Contrastes (WCAG AA) conferidos em test/tokens.test.ts.
 */

// ───────────────────────── Paleta base ─────────────────────────

export const paleta = {
  /** Fundo da página. */
  fundo: "#171721",
  /** Cards, diálogos, barra inferior. */
  card: "#1e1e2a",
  /** Botões secundários, item ativo, campos preenchidos, trilhos de barra. */
  interativo: "#272735",
  /** Texto principal (nunca branco puro). */
  texto: "#ededf3",
  /** Texto de apoio, legendas e rótulos. */
  textoSecundario: "#c3c3cc",
  /** Borda de campos, chips não selecionados e cards em contorno. */
  bordaCampo: "#70707d",
  /** Borda de item selecionado e de foco. */
  bordaSelecionada: "#e2e3ed",
  /** Divisor entre linhas de lista. */
  divisor: "#2c2c3a",
  /** Ação principal (uma por tela). */
  cobalto: "#5266eb",
  /** Cobalto ao passar o mouse ou pressionar. */
  cobaltoPressionado: "#4356d6",
  /**
   * Texto sobre o cobalto. Exceção à regra do "nunca branco puro":
   * #ededf3 sobre #5266eb dá só 4,0:1; branco dá 4,7:1.
   */
  sobreCobalto: "#ffffff",
  /** Texto escuro sobre pílulas claras (segmento ou mês selecionado). */
  sobreClaro: "#171721",
  /** Véu atrás de diálogos e folhas inferiores. */
  veu: "rgba(10, 10, 16, 0.6)",
} as const;

/** Estados de interação: o texto principal em baixa opacidade. */
export const estados = {
  hover: "rgba(237, 237, 243, 0.06)",
  foco: "rgba(237, 237, 243, 0.12)",
  desabilitado: "rgba(237, 237, 243, 0.38)",
  textoDesabilitado: "rgba(237, 237, 243, 0.4)",
} as const;

// ───────────────────────── Cores semânticas ─────────────────────────

/** Fundo suave das semânticas: 14% da cor sobre o card. */
const suave = (r: number, g: number, b: number) => `rgba(${r}, ${g}, ${b}, 0.14)`;

/**
 * Cor nunca é o único sinal: cada semântica traz também o sinal,
 * o texto ou o percentual que a acompanha na tela.
 */
export const semantica = {
  /** Entradas, receitas e rendimentos. Acompanha o sinal "+". */
  receita: { texto: "#7cc4a4", fundo: suave(124, 196, 164), sinal: "+" },
  /** Despesas ficam na cor do texto; o sinal "−" é o indicador. */
  despesa: { texto: paleta.texto, sinal: "−" },
  /** Orçamento a partir de 80%. Acompanha o percentual escrito. */
  atencao: { texto: "#e0b46a", fundo: suave(224, 180, 106), aPartirDe: 80 },
  /** Orçamento a partir de 100% e erros. Acompanha o percentual ou a mensagem. */
  estouro: { texto: "#ef8f7a", fundo: suave(239, 143, 122), aPartirDe: 100 },
  /** Selo "Confirmado": verde sobre fundo suave. */
  confirmado: { texto: "#7cc4a4", fundo: suave(124, 196, 164) },
  /** Selo "Estimado": neutro, com borda tracejada. */
  estimado: { texto: paleta.textoSecundario, borda: paleta.bordaCampo, estiloBorda: "dashed" },
} as const;

/** Cores de identificação dos cartões (pontos e filetes), atribuídas pela ordem de cadastro. */
export const coresCartao = ["#b8a4e8", "#6fc3c0", "#d9b36c", "#d993b4"] as const;

/** Cor do cartão pela posição na lista (repete depois do quarto). */
export function corDoCartao(indice: number): string {
  const i = ((Math.trunc(indice) % coresCartao.length) + coresCartao.length) % coresCartao.length;
  return coresCartao[i]!;
}

/** Cores dos gráficos: o item em destaque (ex.: fatura aberta) usa a cor do texto. */
export const grafico = {
  destaque: paleta.texto,
  // 2,5:1 sobre o card (antes 1,9:1); cada barra também traz o valor escrito.
  inativo: "#5c5c70",
  area: paleta.interativo,
  linha: paleta.texto,
  /** Faixas de distribuição (neutras); cada faixa também traz nome e percentual na legenda. */
  distribuicao: [paleta.texto, paleta.textoSecundario, "#9a9aa8", paleta.bordaCampo, "#5c5c70"],
} as const;

// ───────────────────────── Tipografia ─────────────────────────

export interface EstiloDeTexto {
  tamanho: number;
  alturaLinha: number;
  peso: 400 | 500;
  /** Em em (ex.: -0.02). */
  espacamento?: number;
}

export const tipografia = {
  /** Inter substitui a fonte do Mercury; a variável vem do next/font. */
  familia: 'var(--fonte-inter), Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  /** Títulos em peso médio; nunca 700. */
  pesos: { regular: 400, medio: 500 },
  alturaLinha: 1.5,
  /** Valores monetários alinhados. */
  numeros: "tabular-nums",
  escala: {
    valorDestaque: { tamanho: 40, alturaLinha: 1.15, peso: 500, espacamento: -0.02 },
    valorGrande: { tamanho: 28, alturaLinha: 1.2, peso: 500, espacamento: -0.01 },
    titulo: { tamanho: 28, alturaLinha: 1.25, peso: 500, espacamento: -0.01 },
    secao: { tamanho: 18, alturaLinha: 1.4, peso: 500 },
    subsecao: { tamanho: 16, alturaLinha: 1.4, peso: 500 },
    corpo: { tamanho: 15, alturaLinha: 1.5, peso: 400 },
    apoio: { tamanho: 13, alturaLinha: 1.5, peso: 400 },
    legenda: { tamanho: 12, alturaLinha: 1.5, peso: 400 },
    mini: { tamanho: 11, alturaLinha: 1.4, peso: 400 },
  } satisfies Record<string, EstiloDeTexto>,
} as const;

// ───────────────────────── Espaços e raios ─────────────────────────

/** Espaçamento base de 4 px (o tema MUI usa spacing(n) = n × 4). */
export const espacoBase = 4;

/** Escala de espaços em px. */
export const espaco = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 12: 48 } as const;

/** Espaços de layout usados em várias telas. */
export const layout = {
  paddingCardCelular: 20,
  paddingCardDesktop: 32,
  gapCardsCelular: 12,
  gapCardsDesktop: 24,
  larguraConteudo: 1120,
  larguraMenuLateral: 264,
} as const;

export const raio = {
  /** Cards, diálogos e folhas inferiores. */
  card: 12,
  /** Botões, campos, itens de navegação. */
  pilula: 40,
  /** Chips e selos. */
  chip: 32,
  /** Barras do gráfico. */
  barra: 6,
  /** Barras de progresso finas. */
  barraFina: 2,
  /** Ícones e avatares redondos. */
  circulo: 999,
} as const;

/** Área mínima de toque. */
export const toqueMinimo = 44;

/** Espessura dos ícones em linha (na cor do texto). */
export const iconeTraco = 1.5;

export const breakpoints = { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } as const;
