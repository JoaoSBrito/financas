import { describe, expect, it } from "vitest";
import { contraste, misturar } from "../src/contraste";
import { coresCartao, corDoCartao, grafico, paleta, raio, semantica, tipografia, toqueMinimo } from "../src/tokens";

/** AA: texto normal 4,5:1; componentes de interface e gráficos 3:1. */
const TEXTO = 4.5;
const INTERFACE = 3;

const superficies = { fundo: paleta.fundo, card: paleta.card, interativo: paleta.interativo };

describe("contraste dos textos (AA 4,5:1)", () => {
  const textos = {
    texto: paleta.texto,
    textoSecundario: paleta.textoSecundario,
    receita: semantica.receita.texto,
    atencao: semantica.atencao.texto,
    estouro: semantica.estouro.texto,
    estimado: semantica.estimado.texto,
  };
  for (const [nomeTexto, corTexto] of Object.entries(textos)) {
    for (const [nomeFundo, corFundo] of Object.entries(superficies)) {
      it(`${nomeTexto} sobre ${nomeFundo}`, () => {
        expect(contraste(corTexto, corFundo)).toBeGreaterThanOrEqual(TEXTO);
      });
    }
  }

  it("cores dos cartões sobre o card (usadas também em rótulos)", () => {
    for (const cor of coresCartao) expect(contraste(cor, paleta.card)).toBeGreaterThanOrEqual(TEXTO);
  });

  it("rótulo branco sobre o cobalto (e #ededf3 não passaria)", () => {
    expect(contraste(paleta.sobreCobalto, paleta.cobalto)).toBeGreaterThanOrEqual(TEXTO);
    expect(contraste(paleta.sobreCobalto, paleta.cobaltoPressionado)).toBeGreaterThanOrEqual(TEXTO);
    expect(contraste(paleta.texto, paleta.cobalto)).toBeLessThan(TEXTO);
  });

  it("texto escuro sobre pílula clara selecionada", () => {
    expect(contraste(paleta.sobreClaro, paleta.texto)).toBeGreaterThanOrEqual(TEXTO);
  });

  it("selos: texto sobre o fundo suave (14%) aplicado ao card", () => {
    const confirmado = misturar(semantica.confirmado.texto, paleta.card, 0.14);
    const atencao = misturar(semantica.atencao.texto, paleta.card, 0.14);
    const estouro = misturar(semantica.estouro.texto, paleta.card, 0.14);
    expect(contraste(semantica.confirmado.texto, confirmado)).toBeGreaterThanOrEqual(TEXTO);
    expect(contraste(semantica.atencao.texto, atencao)).toBeGreaterThanOrEqual(TEXTO);
    expect(contraste(semantica.estouro.texto, estouro)).toBeGreaterThanOrEqual(TEXTO);
  });
});

describe("contraste de componentes (AA 3:1)", () => {
  it("borda de campo e borda selecionada sobre o card", () => {
    expect(contraste(paleta.bordaCampo, paleta.card)).toBeGreaterThanOrEqual(INTERFACE);
    expect(contraste(paleta.bordaSelecionada, paleta.card)).toBeGreaterThanOrEqual(INTERFACE);
  });

  it("botão cobalto se distingue do fundo", () => {
    expect(contraste(paleta.cobalto, paleta.fundo)).toBeGreaterThanOrEqual(INTERFACE);
  });

  it("barra em destaque do gráfico e das barras de progresso sobre o trilho", () => {
    expect(contraste(grafico.destaque, paleta.card)).toBeGreaterThanOrEqual(INTERFACE);
    expect(contraste(paleta.texto, paleta.interativo)).toBeGreaterThanOrEqual(INTERFACE);
    expect(contraste(semantica.receita.texto, paleta.interativo)).toBeGreaterThanOrEqual(INTERFACE);
  });
});

describe("demais tokens", () => {
  it("títulos nunca passam do peso 500", () => {
    for (const estilo of Object.values(tipografia.escala)) expect(estilo.peso).toBeLessThanOrEqual(500);
  });

  it("raios e área de toque do guia", () => {
    expect(raio.card).toBe(12);
    expect(raio.pilula).toBeGreaterThanOrEqual(32);
    expect(raio.pilula).toBeLessThanOrEqual(40);
    expect(toqueMinimo).toBeGreaterThanOrEqual(44);
  });

  it("cor do cartão repete pela ordem", () => {
    expect(corDoCartao(0)).toBe(coresCartao[0]);
    expect(corDoCartao(5)).toBe(coresCartao[1]);
    expect(corDoCartao(-1)).toBe(coresCartao[3]);
  });
});
