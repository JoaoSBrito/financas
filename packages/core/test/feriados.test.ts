import { describe, expect, it } from "vitest";
import { ehDiaUtil, pascoa } from "../src";

describe("feriados", () => {
  it("Páscoa de 2027 é 28/mar", () => {
    expect(pascoa(2027)).toBe("2027-03-28");
  });

  it("Finados e terça de Carnaval não são dias úteis", () => {
    expect(ehDiaUtil("2026-11-02")).toBe(false);
    expect(ehDiaUtil("2027-02-09")).toBe(false);
  });

  it("dia comum de semana é útil", () => {
    expect(ehDiaUtil("2026-11-03")).toBe(true);
  });
});
