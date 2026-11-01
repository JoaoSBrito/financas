import { z } from "zod";

/** Data "AAAA-MM-DD" válida no calendário. */
export const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD")
  .refine((s) => {
    const [a, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(a!, m! - 1, d!));
    return dt.getUTCFullYear() === a && dt.getUTCMonth() === m! - 1 && dt.getUTCDate() === d;
  }, "Data inválida");

/** Mês "AAAA-MM". */
export const mesSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido");

/** Valor em centavos, inteiro e positivo. */
export const centavosPositivoSchema = z
  .number({ error: "Informe um valor" })
  .int("Valor em centavos deve ser inteiro")
  .positive("O valor precisa ser maior que zero");

/** Valor em centavos, inteiro, pode ser zero ou negativo (saldos e ajustes). */
export const centavosSchema = z.number().int("Valor em centavos deve ser inteiro");

export const idSchema = z.uuid("Identificador inválido");

export const textoCurto = (max: number, campo: string) =>
  z.string().trim().min(1, `Informe ${campo}`).max(max, `Use até ${max} caracteres`);
