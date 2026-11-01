import { z } from "zod";
import { centavosPositivoSchema, centavosSchema, dataSchema, idSchema, textoCurto } from "./comuns";

export const caixinhaFormSchema = z.object({
  nome: textoCurto(40, "o nome da caixinha"),
  meta: centavosPositivoSchema.nullable(),
  dataMeta: dataSchema.nullable(),
  cartaoId: idSchema.nullable(),
  /** Opcional: sem valor, a caixinha só muda com atualização manual. */
  percentualCdi: z
    .number()
    .positive("Use um valor maior que zero")
    .max(300, "Valor muito alto para % do CDI")
    .nullable(),
});
export type CaixinhaForm = z.infer<typeof caixinhaFormSchema>;

export const transferenciaCaixinhaSchema = z.object({
  caixinhaId: idSchema,
  contaId: idSchema,
  tipo: z.enum(["deposito", "resgate"]),
  valor: centavosPositivoSchema,
  data: dataSchema,
});
export type TransferenciaCaixinha = z.infer<typeof transferenciaCaixinhaSchema>;

export const atualizarSaldoCaixinhaSchema = z.object({
  caixinhaId: idSchema,
  saldoReal: centavosSchema,
});
export type AtualizarSaldoCaixinha = z.infer<typeof atualizarSaldoCaixinhaSchema>;

export const categoriaFormSchema = z.object({
  nome: textoCurto(30, "o nome da categoria"),
  orcamentoMensal: centavosPositivoSchema.nullable(),
});
export type CategoriaForm = z.infer<typeof categoriaFormSchema>;
