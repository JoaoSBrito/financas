import { z } from "zod";
import { idSchema, textoCurto } from "./comuns";

/** Parcela corrigida na revisão: "3 de 10". */
export const parcelaDaLinhaSchema = z
  .object({
    numero: z.number({ error: "Informe a parcela" }).int().min(1, "A parcela começa em 1"),
    total: z
      .number({ error: "Informe o total de parcelas" })
      .int()
      .min(2, "Mínimo de 2 parcelas")
      .max(48, "Máximo de 48 parcelas"),
  })
  .refine((p) => p.numero <= p.total, { path: ["numero"], message: "A parcela não pode passar do total" });

/** O que o usuário pode editar em cada linha da revisão. */
export const edicaoDaLinhaSchema = z.object({
  descricao: textoCurto(80, "uma descrição"),
  categoriaId: idSchema.nullable(),
  parcela: parcelaDaLinhaSchema.nullable(),
});
export type EdicaoDaLinha = z.infer<typeof edicaoDaLinhaSchema>;
