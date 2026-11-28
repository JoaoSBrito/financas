import { describe, expect, it } from "vitest";
import {
  acaoPadrao,
  conciliar,
  idExterno,
  montarImportacao,
  toleranciaDaParcela,
  type DecisaoDaLinha,
  type LancamentoExistente,
  type LinhaConciliada,
  type LinhaDoExtrato,
} from "../src";

const CARTAO = "4b0c3a52-7f0f-4f53-9a5e-2f5b2c6d9e10";
const DEZ = "2026-12";

const linha = (p: Partial<LinhaDoExtrato>): LinhaDoExtrato => ({
  linha: 2,
  data: "2026-11-20",
  descricaoOriginal: "MERCADO",
  descricao: "MERCADO",
  valor: 1000,
  tipo: "gasto",
  parcela: null,
  portador: null,
  ocorrencia: 1,
  ...p,
});

const existente = (p: Partial<LancamentoExistente>): LancamentoExistente => ({
  id: "l1",
  compraId: "c1",
  numero: 1,
  totalParcelas: 1,
  valor: 1000,
  dataCompra: "2026-11-20",
  descricao: "Mercado",
  origem: "app",
  conferida: false,
  ...p,
});

const estados = (r: LinhaConciliada[]) => r.map((l) => l.estado);

describe("idExterno", () => {
  const l = linha({ descricaoOriginal: "Café  Ponto" });
  it("é estável e ignora caixa, acentos e espaços", () => {
    expect(idExterno(CARTAO, DEZ, l)).toBe(idExterno(CARTAO, DEZ, linha({ descricaoOriginal: "CAFE PONTO" })));
    expect(idExterno(CARTAO, DEZ, l)).toMatch(/^imp1:[0-9a-f]{16}$/);
  });
  it("muda com a ocorrência, a fatura e o cartão", () => {
    const base = idExterno(CARTAO, DEZ, l);
    expect(idExterno(CARTAO, DEZ, { ...l, ocorrencia: 2 })).not.toBe(base);
    expect(idExterno(CARTAO, "2027-01", l)).not.toBe(base);
    expect(idExterno("outro", DEZ, l)).not.toBe(base);
  });
});

describe("conciliar", () => {
  it("à vista novo, crédito e pagamento", () => {
    const r = conciliar({
      cartaoId: CARTAO,
      mesFatura: DEZ,
      linhas: [linha({}), linha({ valor: -8990, tipo: "credito" }), linha({ valor: -150000, tipo: "pagamento" })],
      existentes: [],
      idsImportados: new Set(),
    });
    expect(estados(r)).toEqual(["avista", "credito", "fica_de_fora"]);
    expect(r.map((l) => l.aceitaPorPadrao)).toEqual([true, true, false]);
  });

  it("parcela que já está na fatura vira 'já no app', com a diferença de valor", () => {
    const r = conciliar({
      cartaoId: CARTAO,
      mesFatura: DEZ,
      linhas: [linha({ descricaoOriginal: "MAGALU", valor: 30001, parcela: { numero: 4, total: 12 } })],
      existentes: [existente({ id: "gel", compraId: "c-gel", descricao: "Geladeira", numero: 4, totalParcelas: 12, valor: 30000 })],
      idsImportados: new Set(),
    });
    expect(r[0]).toMatchObject({ estado: "ja_no_app", aceitaPorPadrao: true, vinculo: { lancamentoId: "gel", diferenca: 1 } });
  });

  it("parcela sem correspondente é 'parcela nova'", () => {
    const r = conciliar({
      cartaoId: CARTAO,
      mesFatura: DEZ,
      linhas: [linha({ descricaoOriginal: "AMAZON MKTP", valor: 10000, parcela: { numero: 6, total: 10 } })],
      // Outra compra de 10x, mas em outra parcela e com outro valor: não casa.
      existentes: [existente({ numero: 2, totalParcelas: 10, valor: 25000, descricao: "Sofá" })],
      idsImportados: new Set(),
    });
    expect(estados(r)).toEqual(["parcela_nova"]);
  });

  it("parcela fora da tolerância de valor não casa", () => {
    expect(toleranciaDaParcela(10000)).toBe(500);
    const r = conciliar({
      cartaoId: CARTAO,
      mesFatura: DEZ,
      linhas: [linha({ valor: 10600, parcela: { numero: 4, total: 12 } })],
      existentes: [existente({ numero: 4, totalParcelas: 12, valor: 10000, descricao: "Outra" })],
      idsImportados: new Set(),
    });
    expect(estados(r)).toEqual(["parcela_nova"]);
  });

  it("mesma compra lançada com outro número de parcela é possível duplicado", () => {
    const r = conciliar({
      cartaoId: CARTAO,
      mesFatura: DEZ,
      linhas: [linha({ descricaoOriginal: "AMAZON NOTEBOOK", valor: 10000, parcela: { numero: 6, total: 10 } })],
      existentes: [existente({ numero: 5, totalParcelas: 10, valor: 10000, descricao: "Notebook" })],
      idsImportados: new Set(),
    });
    expect(r[0]).toMatchObject({ estado: "possivel_duplicado", aceitaPorPadrao: false, vinculo: { numero: 5 } });
  });

  it("gasto lançado à mão com o mesmo valor até 2 dias antes ou depois é possível duplicado", () => {
    const r = conciliar({
      cartaoId: CARTAO,
      mesFatura: DEZ,
      linhas: [linha({ data: "2026-11-18", valor: 5290 }), linha({ data: "2026-11-25", valor: 5290 })],
      existentes: [existente({ id: "jantar", dataCompra: "2026-11-20", valor: 5290, descricao: "Jantar" })],
      idsImportados: new Set(),
    });
    expect(estados(r)).toEqual(["possivel_duplicado", "avista"]);
    expect(r[0]!.vinculo?.lancamentoId).toBe("jantar");
  });

  it("cada lançamento existente casa com uma linha só", () => {
    const r = conciliar({
      cartaoId: CARTAO,
      mesFatura: DEZ,
      linhas: [linha({ ocorrencia: 1 }), linha({ ocorrencia: 2 })],
      existentes: [existente({})],
      idsImportados: new Set(),
    });
    expect(estados(r)).toEqual(["possivel_duplicado", "avista"]);
    expect(r.every((l) => l.repetidaNoArquivo)).toBe(true);
  });

  it("saldo inicial da fatura nunca casa com uma linha", () => {
    const r = conciliar({
      cartaoId: CARTAO,
      mesFatura: DEZ,
      linhas: [linha({ valor: 64000 })],
      existentes: [existente({ origem: "saldo_inicial", valor: 64000, dataCompra: null })],
      idsImportados: new Set(),
    });
    expect(estados(r)).toEqual(["avista"]);
  });

  it("linha já importada antes fica bloqueada", () => {
    const l = linha({});
    const r = conciliar({ cartaoId: CARTAO, mesFatura: DEZ, linhas: [l], existentes: [], idsImportados: new Set([idExterno(CARTAO, DEZ, l)]) });
    expect(r[0]).toMatchObject({ estado: "ja_importado", aceitaPorPadrao: false });
  });

  it("avisa quando a data indica outra fatura (à vista), mas não nas parcelas", () => {
    const r = conciliar({
      cartaoId: CARTAO,
      mesFatura: DEZ,
      linhas: [linha({ data: "2026-12-05" }), linha({ data: "2026-06-15", parcela: { numero: 6, total: 10 } })],
      existentes: [],
      idsImportados: new Set(),
      mesPelaData: (d) => (d > "2026-12-03" ? "2027-01" : DEZ),
    });
    expect(r.map((l) => l.foraDoCiclo)).toEqual([true, false]);
  });
});

describe("montarImportacao", () => {
  // Como na leitura real: a descrição sugerida parte da original.
  const doArquivo = (p: Partial<LinhaDoExtrato>) => linha({ ...p, descricao: p.descricaoOriginal ?? "MERCADO" });
  const conciliadas = conciliar({
    cartaoId: CARTAO,
    mesFatura: DEZ,
    linhas: [
      doArquivo({ linha: 2, descricaoOriginal: "PAO DE ACUCAR 1234", valor: 45000 }),
      doArquivo({ linha: 3, data: "2026-06-15", descricaoOriginal: "AMAZON MKTP", valor: 10000, parcela: { numero: 6, total: 10 } }),
      doArquivo({ linha: 4, descricaoOriginal: "MAGALU", valor: 30001, parcela: { numero: 4, total: 12 } }),
      doArquivo({ linha: 5, descricaoOriginal: "IFOOD", data: "2026-11-18", valor: 5290 }),
      doArquivo({ linha: 6, descricaoOriginal: "ESTORNO LOJA Y", valor: -8990, tipo: "credito" }),
      doArquivo({ linha: 7, descricaoOriginal: "PAGAMENTO RECEBIDO", valor: -150000, tipo: "pagamento" }),
    ],
    existentes: [
      existente({ id: "gel", numero: 4, totalParcelas: 12, valor: 30000, descricao: "Geladeira" }),
      existente({ id: "jantar", dataCompra: "2026-11-18", valor: 5290, descricao: "Jantar" }),
    ],
    idsImportados: new Set(),
  });
  const decisoes = (ajustes: Partial<Record<number, Partial<DecisaoDaLinha>>> = {}): DecisaoDaLinha[] =>
    conciliadas.map((l) => ({ linha: l, acao: acaoPadrao(l), descricao: l.descricao, categoriaId: null, parcela: l.parcela, ...ajustes[l.linha] }));

  it("ação inicial segue o estado de cada linha", () => {
    expect(conciliadas.map(acaoPadrao)).toEqual(["importar", "importar", "conferir", "ignorar", "importar", "ignorar"]);
  });

  it("à vista, parcela nova e crédito viram compras; 'já no app' vira conferência", () => {
    const m = montarImportacao(DEZ, decisoes({ 2: { descricao: "Mercado", categoriaId: "cat-mercado" }, 3: { descricao: "Notebook" } }));
    expect(m.compras.map((c) => [c.descricao, c.origem, c.valorTotal, c.parcelas.length])).toEqual([
      ["Mercado", "importada", 45000, 1],
      ["Notebook", "importada", 100000, 10],
      ["ESTORNO LOJA Y", "credito", -8990, 1],
    ]);
    expect(m.compras[0]).toMatchObject({ categoriaId: "cat-mercado", dataCompra: "2026-11-20", descricaoOriginal: "PAO DE ACUCAR 1234" });
    expect(m.conferencias).toEqual([{ lancamentoId: "gel", novoValor: null }]);
    expect(m.quantidade).toBe(3);
    expect(m.totalNaFatura).toBe(45000 + 10000 - 8990);
  });

  it("parcela nova 6 de 10 em dezembro: 1 a 5 como histórico e a última em abril", () => {
    const notebook = montarImportacao(DEZ, decisoes()).compras[1]!;
    expect(notebook.parcelas.filter((p) => p.historico).map((p) => p.numero)).toEqual([1, 2, 3, 4, 5]);
    expect(notebook.parcelas[5]).toEqual({ numero: 6, mes: DEZ, valor: 10000, historico: false });
    expect(notebook.parcelas[9]!.mes).toBe("2027-04");
    expect(montarImportacao(DEZ, decisoes()).ultimoMes).toBe("2027-04");
  });

  it("correções da revisão: parcela editada, valor do banco e duplicado importado mesmo assim", () => {
    const m = montarImportacao(
      DEZ,
      decisoes({
        2: { parcela: { numero: 1, total: 3 } },
        4: { usarValorDoBanco: true },
        5: { acao: "importar" },
      }),
    );
    expect(m.compras[0]!.parcelas.map((p) => p.mes)).toEqual([DEZ, "2027-01", "2027-02"]);
    expect(m.compras[0]!.valorTotal).toBe(135000);
    expect(m.conferencias).toEqual([{ lancamentoId: "gel", novoValor: 30001 }]);
    expect(m.compras.some((c) => c.descricaoOriginal === "IFOOD")).toBe(true);
  });

  it("vincular um duplicado só confere o lançamento existente", () => {
    const m = montarImportacao(DEZ, decisoes({ 5: { acao: "conferir" } }));
    expect(m.conferencias.map((c) => c.lancamentoId)).toEqual(["gel", "jantar"]);
  });

  it("recusar tudo não grava nada", () => {
    const m = montarImportacao(DEZ, conciliadas.map((l) => ({ linha: l, acao: "ignorar" as const, descricao: l.descricao, categoriaId: null, parcela: l.parcela })));
    expect(m).toEqual({ compras: [], conferencias: [], ultimoMes: DEZ, quantidade: 0, totalNaFatura: 0 });
  });
});
