import { describe, expect, it } from "vitest";
import {
  analisarExtrato,
  classificarLinha,
  decodificarArquivo,
  detectarColunas,
  detectarSeparador,
  edicaoDaLinhaSchema,
  lerCsv,
  lerDataFlexivel,
  lerValorFlexivel,
  reconhecerParcela,
} from "../src";

describe("decodificarArquivo", () => {
  it("lê UTF-8 e remove o BOM", () => {
    const bytes = new TextEncoder().encode("\uFEFFData;Descrição");
    expect(decodificarArquivo(bytes)).toEqual({ texto: "Data;Descrição", encoding: "utf-8" });
  });

  it("cai para Latin-1 quando o arquivo não é UTF-8", () => {
    // "PÃO" em Windows-1252: Ã = 0xC3 seguido de "O" não forma UTF-8 válido.
    const bytes = new Uint8Array([0x50, 0xc3, 0x4f]);
    expect(decodificarArquivo(bytes)).toEqual({ texto: "PÃO", encoding: "latin1" });
  });
});

describe("detectarSeparador e lerCsv", () => {
  it("escolhe o separador mais frequente fora de aspas", () => {
    expect(detectarSeparador("Data;Descrição;Valor\n")).toBe(";");
    expect(detectarSeparador('date,title,amount\n')).toBe(",");
    expect(detectarSeparador('"a;b;c",x,y\n')).toBe(",");
  });

  it("respeita aspas, aspas escapadas, CRLF e pula linhas vazias", () => {
    const texto = 'a;"b;c";"diz ""oi"""\r\n\r\n1;2;3\r\n';
    expect(lerCsv(texto, ";")).toEqual([
      { linha: 1, celulas: ["a", "b;c", 'diz "oi"'] },
      { linha: 3, celulas: ["1", "2", "3"] },
    ]);
  });

  it("numera pela linha física, mesmo com quebra dentro de aspas", () => {
    const texto = 'cab\n"duas\nlinhas";x\nfim';
    expect(lerCsv(texto, ";").map((l) => l.linha)).toEqual([1, 2, 4]);
  });
});

describe("lerDataFlexivel", () => {
  it.each([
    ["20/11/2026", "2026-11-20"],
    ["5/1/2026", "2026-01-05"],
    ["20/11/26", "2026-11-20"],
    ["20-11-2026", "2026-11-20"],
    ["20.11.2026", "2026-11-20"],
    ["2026-11-20", "2026-11-20"],
    ["2026-11-20T10:30:00", "2026-11-20"],
  ])("%s vira %s", (texto, esperado) => {
    expect(lerDataFlexivel(texto)).toBe(esperado);
  });

  it.each(["31/02/2026", "00/11/2026", "20/13/2026", "ontem", ""])("rejeita %j", (texto) => {
    expect(lerDataFlexivel(texto)).toBeNull();
  });
});

describe("lerValorFlexivel", () => {
  it.each([
    ["R$ 1.234,56", 123456],
    ["1.234,56", 123456],
    ["-R$ 89,90", -8990],
    ["R$ -89,90", -8990],
    ["(12,00)", -1200],
    ["12,00-", -1200],
    ["1234.56", 123456],
    ["1,234.56", 123456],
    ["52,9", 5290],
    ["1.234", 123400],
    ["1.234.567", 123456700],
    ["450", 45000],
  ])("%s vira %i centavos", (texto, esperado) => {
    expect(lerValorFlexivel(texto)).toBe(esperado);
  });

  it("sem algarismos é inválido", () => {
    expect(lerValorFlexivel("R$")).toBeNull();
    expect(lerValorFlexivel("")).toBeNull();
  });
});

describe("reconhecerParcela", () => {
  it.each([
    ["AMAZON MKTP 06/10", "AMAZON MKTP", 6, 10],
    ["AMAZON MKTP 6/10", "AMAZON MKTP", 6, 10],
    ["LOJA X PARC 03/10", "LOJA X", 3, 10],
    ["LOJA X - PARCELA 3 DE 10", "LOJA X", 3, 10],
    ["LOJA X 12/12", "LOJA X", 12, 12],
  ])("descrição %j", (descricao, limpa, numero, total) => {
    expect(reconhecerParcela(descricao)).toEqual({ parcela: { numero, total }, descricaoSemParcela: limpa });
  });

  it.each([["SHOP 25/12"], ["LOJA 0/5"], ["LOJA 3/50"], ["LOJA 1/1"], ["LOJA12/10"], ["PAO DE ACUCAR 1234"]])("não é parcela: %j", (descricao) => {
    expect(reconhecerParcela(descricao).parcela).toBeNull();
  });

  it("a coluna de parcela tem prioridade e limpa o sufixo da descrição", () => {
    expect(reconhecerParcela("MAGALU 04/12", "4 de 12")).toEqual({ parcela: { numero: 4, total: 12 }, descricaoSemParcela: "MAGALU" });
    expect(reconhecerParcela("MAGALU", "Parcela 4/12")).toEqual({ parcela: { numero: 4, total: 12 }, descricaoSemParcela: "MAGALU" });
  });

  it('coluna "-" ou vazia: tenta pela descrição', () => {
    expect(reconhecerParcela("LOJA 02/03", "-").parcela).toEqual({ numero: 2, total: 3 });
    expect(reconhecerParcela("LOJA", "").parcela).toBeNull();
  });
});

describe("classificarLinha", () => {
  it("positivo é gasto; negativo é crédito, salvo se for pagamento da fatura", () => {
    expect(classificarLinha("MERCADO", 1000)).toBe("gasto");
    expect(classificarLinha("ESTORNO LOJA Y", -8990)).toBe("credito");
    expect(classificarLinha("Pagamento recebido", -150000)).toBe("pagamento");
    expect(classificarLinha("PGTO FATURA", -150000)).toBe("pagamento");
  });
});

describe("detectarColunas", () => {
  it("reconhece o XP, o Nubank e cabeçalhos genéricos", () => {
    expect(detectarColunas(["Data", "Estabelecimento", "Portador", "Valor", "Parcela"])).toEqual({
      mapeamento: { data: 0, descricao: 1, valor: 3, parcela: 4, portador: 2 },
      formato: "xp",
    });
    expect(detectarColunas(["date", "title", "amount"])?.formato).toBe("nubank");
    expect(detectarColunas(["Data da compra", "Descrição", "Valor (R$)"])).toEqual({
      mapeamento: { data: 0, descricao: 1, valor: 2, parcela: undefined, portador: undefined },
      formato: "generico",
    });
  });

  it("sem data, descrição e valor, pede o mapeamento", () => {
    expect(detectarColunas(["20/11/2026", "MERCADO", "450,00"])).toBeNull();
  });
});

const XP = [
  "Data;Estabelecimento;Portador;Valor;Parcela",
  "20/11/2026;PAO DE ACUCAR 1234;JOAO V B;R$ 450,00;-",
  "15/06/2026;AMAZON MKTP;JOAO V B;R$ 100,00;6 de 10",
  "02/08/2026;MAGALU;JOAO V B;R$ 300,00;4 de 12",
  "18/11/2026;IFOOD *RESTAURANTE;JOAO V B;R$ 52,90;-",
  "22/11/2026;ESTORNO LOJA Y;JOAO V B;-R$ 89,90;-",
  "05/11/2026;PAGAMENTO RECEBIDO;JOAO V B;-R$ 1.500,00;-",
  "31/02/2026;LINHA RUIM;JOAO V B;R$ 1,00;-",
  "21/11/2026;CAFE;JOAO V B;R$ 8,00;-",
  "21/11/2026;CAFE;JOAO V B;R$ 8,00;-",
].join("\n");

describe("analisarExtrato", () => {
  const r = analisarExtrato(XP);
  if (!r.ok) throw new Error("deveria ler o arquivo do XP");

  it("reconhece o formato XP e lê cada lançamento", () => {
    expect(r.formato).toBe("xp");
    expect(r.separador).toBe(";");
    expect(r.linhas).toHaveLength(8);
    expect(r.linhas[0]).toEqual({
      linha: 2,
      data: "2026-11-20",
      descricaoOriginal: "PAO DE ACUCAR 1234",
      descricao: "PAO DE ACUCAR 1234",
      valor: 45000,
      tipo: "gasto",
      parcela: null,
      portador: "JOAO V B",
      ocorrencia: 1,
    });
    expect(r.linhas[1]).toMatchObject({ descricao: "AMAZON MKTP", valor: 10000, parcela: { numero: 6, total: 10 } });
  });

  it("separa crédito e pagamento e lista as linhas inválidas com o motivo", () => {
    expect(r.linhas.find((l) => l.descricaoOriginal === "ESTORNO LOJA Y")).toMatchObject({ valor: -8990, tipo: "credito" });
    expect(r.linhas.find((l) => l.descricaoOriginal === "PAGAMENTO RECEBIDO")).toMatchObject({ valor: -150000, tipo: "pagamento" });
    expect(r.erros).toEqual([{ linha: 8, motivo: 'data "31/02/2026" inválida' }]);
    expect(r.sinalInvertido).toBe(false);
  });

  it("conta repetições da mesma linha no arquivo", () => {
    expect(r.linhas.filter((l) => l.descricaoOriginal === "CAFE").map((l) => l.ocorrencia)).toEqual([1, 2]);
  });

  it("inverte o sinal quando o banco exporta gastos como negativos", () => {
    const negativo = analisarExtrato("data,descricao,valor\n2026-11-20,MERCADO,-450.00\n2026-11-21,CAFE,-8.00\n2026-11-22,ESTORNO,12.00\n");
    if (!negativo.ok) throw new Error("deveria ler");
    expect(negativo.sinalInvertido).toBe(true);
    expect(negativo.linhas.map((l) => [l.valor, l.tipo])).toEqual([
      [45000, "gasto"],
      [800, "gasto"],
      [-1200, "credito"],
    ]);
  });

  it("sem cabeçalho reconhecível, pede o mapeamento e mostra uma amostra", () => {
    const semCabecalho = "20/11/2026;MERCADO;450,00\n21/11/2026;CAFE;8,00";
    const r1 = analisarExtrato(semCabecalho);
    expect(r1).toMatchObject({ ok: false, motivo: "colunas", amostra: [["20/11/2026", "MERCADO", "450,00"], ["21/11/2026", "CAFE", "8,00"]] });
    const r2 = analisarExtrato(semCabecalho, { mapeamento: { data: 0, descricao: 1, valor: 2 } });
    expect(r2.ok && r2.linhas.map((l) => l.valor)).toEqual([45000, 800]);
  });

  it("arquivo vazio é recusado", () => {
    expect(analisarExtrato("\n\n")).toMatchObject({ ok: false, motivo: "vazio" });
  });
});

describe("edicaoDaLinhaSchema", () => {
  const id = "4b0c3a52-7f0f-4f53-9a5e-2f5b2c6d9e10";
  it("aceita descrição, categoria e parcela válidas", () => {
    expect(edicaoDaLinhaSchema.safeParse({ descricao: " Notebook ", categoriaId: id, parcela: { numero: 6, total: 10 } }).success).toBe(true);
  });
  it("recusa parcela acima do total e descrição vazia", () => {
    const r = edicaoDaLinhaSchema.safeParse({ descricao: " ", categoriaId: null, parcela: { numero: 11, total: 10 } });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message)).toEqual(["Informe uma descrição", "A parcela não pode passar do total"]);
  });
});
