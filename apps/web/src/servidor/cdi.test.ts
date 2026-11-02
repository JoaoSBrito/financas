import { describe, expect, it } from "vitest";
import { interpretarSerieCdi, planejarRendimentos, urlSerieCdi } from "./cdi";

describe("CDI do Banco Central", () => {
  it("monta a URL da série 12 com datas no formato brasileiro", () => {
    expect(urlSerieCdi("2026-10-02", "2026-11-01")).toBe(
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=02/10/2026&dataFinal=01/11/2026",
    );
  });

  it("interpreta a resposta e ordena por data", () => {
    expect(
      interpretarSerieCdi([
        { data: "04/11/2026", valor: "0.055131" },
        { data: "03/11/2026", valor: "0.055131" },
      ]),
    ).toEqual([
      { data: "2026-11-03", taxaDia: 0.055131 },
      { data: "2026-11-04", taxaDia: 0.055131 },
    ]);
  });

  it("recusa respostas fora do formato", () => {
    expect(() => interpretarSerieCdi({ erro: "x" })).toThrow();
  });
});

describe("planejarRendimentos", () => {
  const taxas = [
    { data: "2026-11-03", taxaDia: 0.05 },
    { data: "2026-11-04", taxaDia: 0.05 },
  ];

  it("aplica só as taxas depois do último cálculo", () => {
    const r = planejarRendimentos(
      [{ id: "a", userId: "u", saldo: 1000000, percentualCdi: 100, calculadoAte: "2026-11-03" }],
      taxas,
      "2026-11-05",
    );
    expect(r.lancamentos).toEqual([{ caixinhaId: "a", userId: "u", valor: 500, ate: "2026-11-04" }]);
  });

  it("caixinha nova só marca o início; sem % do CDI é ignorada", () => {
    const r = planejarRendimentos(
      [
        { id: "nova", userId: "u", saldo: 1000, percentualCdi: 100, calculadoAte: null },
        { id: "sem", userId: "u", saldo: 1000, percentualCdi: null, calculadoAte: "2026-11-01" },
      ],
      taxas,
      "2026-11-05",
    );
    expect(r).toEqual({ lancamentos: [], iniciar: ["nova"] });
  });

  it("nada a fazer quando já está em dia", () => {
    const r = planejarRendimentos([{ id: "a", userId: "u", saldo: 1000, percentualCdi: 110, calculadoAte: "2026-11-04" }], taxas, "2026-11-05");
    expect(r.lancamentos).toEqual([]);
  });
});
