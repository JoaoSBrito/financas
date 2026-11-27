/**
 * Tokens de design puros (sem MUI), reaproveitáveis num futuro app Expo.
 *
 * Marca Lastro (Design System v1): painel de controle escuro, painéis com borda fina,
 * rótulos em caixa alta monoespaçada, números alinhados e uma única cor de ação (lima),
 * que também marca o que entra (receita, rendimento).
 *
 * Os nomes seguem o Design System ("Do design para o código"). Contrastes AA
 * conferidos em test/tokens.test.ts.
 */

// ───────────────────────── Paleta base ─────────────────────────

const base = {
  /** cor.fundo: fundo da página. */
  fundo: "#0E0F11",
  /** cor.painel: painéis, barras, folhas e diálogos. */
  painel: "#17191C",
  /** cor.elevado: campos e áreas de destaque dentro de painéis. */
  elevado: "#1F2226",
  /** cor.divisor: borda de painel, trilhos de barra, linhas de lista. */
  divisor: "#2A2E33",
  /** cor.contorno: borda de diálogo e folha inferior. */
  contorno: "#3A3F46",
  /** cor.bordaControle: borda de campo e botão secundário (3,6:1). */
  bordaControle: "#6B727C",
  /** cor.texto: texto principal. */
  texto: "#E8EAED",
  /** cor.textoSecundario: rótulos, apoio, legendas. */
  textoSecundario: "#A3A9B2",
  /** cor.acao: ação principal, receita e foco (lima). */
  acao: "#C6F432",
  /** cor.acaoPressionada: hover e pressionado da ação. */
  acaoPressionada: "#B3E01F",
  /** cor.sobreAcao: texto sobre lima e sobre pílula clara selecionada. */
  sobreAcao: "#0E0F11",
  /** cor.veu: véu atrás de folhas e diálogos. */
  veu: "rgba(5, 6, 8, 0.72)",
} as const;

/** Paleta da Lastro, com os nomes do Design System. */
export const paleta = base;

/** Estados de interação: o texto principal em baixa opacidade. */
export const estados = {
  hover: "rgba(232, 234, 237, 0.06)",
  foco: "rgba(232, 234, 237, 0.12)",
  desabilitado: "rgba(232, 234, 237, 0.38)",
  textoDesabilitado: "rgba(232, 234, 237, 0.4)",
} as const;

// ───────────────────────── Cores semânticas ─────────────────────────

/**
 * Cor nunca é o único sinal: cada semântica traz também o sinal,
 * o texto ou o percentual que a acompanha na tela.
 */
export const semantica = {
  /** Entradas, receitas e rendimentos (cor.acao). Acompanha o sinal "+". */
  receita: { texto: base.acao, fundo: "#2A3A0E", sinal: "+" },
  /** Despesas ficam na cor do texto; o sinal "−" é o indicador. */
  despesa: { texto: base.texto, sinal: "−" },
  /** cor.atencao: ≥ 80% do orçamento, fecha em breve. Acompanha o percentual ou o prazo. */
  atencao: { texto: "#F2B544", fundo: "#3A2E12", aPartirDe: 80 },
  /** cor.estouro: ≥ 100%, vencida, erro, destrutivo. Acompanha o percentual ou a mensagem. */
  estouro: { texto: "#FF7A66", fundo: "#3A1C18", aPartirDe: 100 },
  /** Selo "Confirmado" / "Paga" / "Reserva": lima sobre cor.receitaFundo. */
  confirmado: { texto: base.acao, fundo: "#2A3A0E" },
  /** Selo "Estimado": neutro, com borda tracejada. */
  estimado: { texto: base.textoSecundario, borda: base.bordaControle, estiloBorda: "dashed" },
} as const;

/** Cores de identificação dos cartões (cartao.1–4), pela ordem de cadastro. */
export const coresCartao = ["#8FB8FF", "#D7A4FF", "#5ED3C3", "#D9C9A3"] as const;

/** Fundo escuro do cartão físico, derivado da cor de identificação. */
export const fundosCartao = ["#18202E", "#211A28", "#132624", "#26231B"] as const;

const indiceCiclico = (indice: number, total: number) => ((Math.trunc(indice) % total) + total) % total;

/** Cor do cartão pela posição na lista (repete depois do quarto). */
export function corDoCartao(indice: number): string {
  return coresCartao[indiceCiclico(indice, coresCartao.length)]!;
}

/** Fundo do cartão físico pela posição na lista. */
export function fundoDoCartao(indice: number): string {
  return fundosCartao[indiceCiclico(indice, fundosCartao.length)]!;
}

/** Cores dos gráficos (grafico.*). */
export const grafico = {
  destaque: base.texto,
  inativo: base.bordaControle,
  area: base.elevado,
  linha: base.texto,
  /** Faixas de distribuição (série 1–4); cada faixa também traz nome e percentual na legenda. */
  distribuicao: [base.texto, base.textoSecundario, base.bordaControle, base.contorno],
} as const;

// ───────────────────────── Tipografia ─────────────────────────

export interface EstiloDeTexto {
  tamanho: number;
  alturaLinha: number;
  peso: 400 | 500 | 600;
  /** Em em (ex.: -0.02). */
  espacamento?: number;
  /** Valores, datas e rótulos usam a mono. */
  mono?: boolean;
  caixaAlta?: boolean;
}

export const tipografia = {
  /** Interface: Space Grotesk (variável vem do next/font). */
  familia: 'var(--fonte-grotesk), "Space Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif',
  /** Valores, datas e rótulos: JetBrains Mono. */
  familiaMono: 'var(--fonte-mono), "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  /** 600 só em botões e no logotipo. */
  pesos: { regular: 400, medio: 500, forte: 600 },
  alturaLinha: 1.5,
  numeros: "tabular-nums",
  escala: {
    valorDestaque: { tamanho: 40, alturaLinha: 1.1, peso: 500, espacamento: -0.03, mono: true },
    valorGrande: { tamanho: 28, alturaLinha: 1.15, peso: 500, espacamento: -0.02, mono: true },
    valor: { tamanho: 15, alturaLinha: 1.35, peso: 400, mono: true },
    titulo: { tamanho: 28, alturaLinha: 1.2, peso: 500, espacamento: -0.01 },
    secao: { tamanho: 17, alturaLinha: 1.4, peso: 500 },
    subsecao: { tamanho: 15, alturaLinha: 1.4, peso: 500 },
    corpo: { tamanho: 15, alturaLinha: 1.5, peso: 400 },
    apoio: { tamanho: 13, alturaLinha: 1.5, peso: 400 },
    legenda: { tamanho: 12, alturaLinha: 1.5, peso: 400 },
    rotulo: { tamanho: 11, alturaLinha: 1.45, peso: 400, espacamento: 0.08, mono: true, caixaAlta: true },
    mini: { tamanho: 11, alturaLinha: 1.4, peso: 400 },
    botao: { tamanho: 15, alturaLinha: 1.35, peso: 600 },
  } satisfies Record<string, EstiloDeTexto>,
} as const;

// ───────────────────────── Espaços, forma e camadas ─────────────────────────

/** Espaçamento base de 4 px (o tema MUI usa spacing(n) = n × 4). */
export const espacoBase = 4;

/** esp.* em px. */
export const espaco = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;

/** layout.* */
export const layout = {
  margemCelular: 16,
  margemDesktop: 32,
  paddingCardCelular: 16,
  paddingCardDesktop: 24,
  gapCardsCelular: 12,
  gapCardsDesktop: 16,
  larguraConteudo: 1180,
  alturaBarraTopo: 64,
} as const;

/** raio.* */
export const raio = {
  /** Selos e rótulos. */
  selo: 4,
  /** Botões, campos, segmentos e filtros. */
  controle: 8,
  /** Painéis, folhas (topo) e diálogos. */
  painel: 10,
  /** Representação do cartão físico. */
  cartaoFisico: 14,
  /** Botão central e ícone do app. */
  icone: 12,
  /** Barras são retas. */
  barra: 0,
  circulo: 999,
} as const;

/** toque.minimo: área mínima de toque, sem exceção. */
export const toqueMinimo = 44;

/** Espessura dos ícones em linha (na cor do texto). */
export const iconeTraco = 1.6;

/** mov.* */
export const movimento = {
  rapido: 120,
  padrao: 200,
  curva: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

/** z.* */
export const camada = { conteudo: 0, barra: 10, sobreposicao: 20, aviso: 30 } as const;

export const breakpoints = { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } as const;
