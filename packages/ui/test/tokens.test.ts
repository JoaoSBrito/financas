import { describe, expect, it } from "vitest";
import { contraste } from "../src/contraste";
import {
  coresCartao,
  corDoCartao,
  fundoDoCartao,
  fundosCartao,
  grafico,
  paleta,
  raio,
  semantica,
  tipografia,
  toqueMinimo,
} from "../src/tokens";

/** AA: texto normal 4,5:1; componentes de interface e gráficos 3:1. */
const TEXTO = 4.5;
const INTERFACE = 3;

const superficies = { fundo: paleta.fundo, painel: paleta.painel, elevado: paleta.elevado };

describe("contraste dos textos (AA 4,5:1)", () => {
  const textos = {
    texto: paleta.texto,
    textoSecundario: paleta.textoSecundario,
    acao: paleta.acao,
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

  it("cores dos cartões sobre o painel (usadas também em rótulos)", () => {
    for (const cor of coresCartao) expect(contraste(cor, paleta.painel)).toBeGreaterThanOrEqual(TEXTO);
  });

  it("texto sobre o fundo de cada cartão físico", () => {
    for (const fundo of fundosCartao) {
      expect(contraste(paleta.texto, fundo)).toBeGreaterThanOrEqual(TEXTO);
      expect(contraste(paleta.textoSecundario, fundo)).toBeGreaterThanOrEqual(TEXTO);
    }
  });

  it("rótulo escuro sobre a ação (lima), inclusive pressionada", () => {
    expect(contraste(paleta.sobreAcao, paleta.acao)).toBeGreaterThanOrEqual(TEXTO);
    expect(contraste(paleta.sobreAcao, paleta.acaoPressionada)).toBeGreaterThanOrEqual(TEXTO);
  });

  it("texto escuro sobre pílula clara selecionada", () => {
    expect(contraste(paleta.sobreAcao, paleta.texto)).toBeGreaterThanOrEqual(TEXTO);
  });

  it("selos: texto sobre o próprio fundo", () => {
    expect(contraste(semantica.confirmado.texto, semantica.confirmado.fundo)).toBeGreaterThanOrEqual(TEXTO);
    expect(contraste(semantica.atencao.texto, semantica.atencao.fundo)).toBeGreaterThanOrEqual(TEXTO);
    expect(contraste(semantica.estouro.texto, semantica.estouro.fundo)).toBeGreaterThanOrEqual(TEXTO);
  });
});

describe("contraste de componentes (AA 3:1)", () => {
  it("borda de controle e borda selecionada sobre painel e elevado", () => {
    for (const fundo of [paleta.painel, paleta.elevado]) {
      expect(contraste(paleta.bordaControle, fundo)).toBeGreaterThanOrEqual(INTERFACE);
      expect(contraste(paleta.bordaSelecionada, fundo)).toBeGreaterThanOrEqual(INTERFACE);
    }
  });

  it("ação (lima) se distingue do fundo; anel de foco visível", () => {
    expect(contraste(paleta.acao, paleta.fundo)).toBeGreaterThanOrEqual(INTERFACE);
    expect(contraste(paleta.acao, paleta.painel)).toBeGreaterThanOrEqual(INTERFACE);
  });

  it("barras de gráfico e de progresso sobre o trilho", () => {
    expect(contraste(grafico.destaque, paleta.painel)).toBeGreaterThanOrEqual(INTERFACE);
    expect(contraste(grafico.inativo, paleta.painel)).toBeGreaterThanOrEqual(INTERFACE);
    expect(contraste(paleta.texto, paleta.divisor)).toBeGreaterThanOrEqual(INTERFACE);
    expect(contraste(paleta.acao, paleta.divisor)).toBeGreaterThanOrEqual(INTERFACE);
  });
});

describe("demais tokens", () => {
  it("peso 600 só no botão; demais estilos até 500", () => {
    for (const [nome, estilo] of Object.entries(tipografia.escala)) {
      expect(estilo.peso).toBeLessThanOrEqual(nome === "botao" ? 600 : 500);
    }
  });

  it("raios e área de toque do Design System", () => {
    expect(raio.selo).toBe(4);
    expect(raio.controle).toBe(8);
    expect(raio.painel).toBe(10);
    expect(raio.cartaoFisico).toBe(14);
    expect(raio.barra).toBe(0);
    expect(toqueMinimo).toBeGreaterThanOrEqual(44);
  });

  it("cor e fundo do cartão repetem pela ordem", () => {
    expect(corDoCartao(0)).toBe(coresCartao[0]);
    expect(corDoCartao(5)).toBe(coresCartao[1]);
    expect(corDoCartao(-1)).toBe(coresCartao[3]);
    expect(fundoDoCartao(4)).toBe(fundosCartao[0]);
  });
});
