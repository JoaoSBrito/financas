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
  /** Meses de cobertura quando a caixinha é a reserva de emergência (nulo = caixinha comum). */
  reservaMeses: z.number().int().min(1, "Mínimo de 1 mês").max(36, "Máximo de 36 meses").nullable(),
});
export type CaixinhaForm = z.infer<typeof caixinhaFormSchema>;

export const transferenciaEntreContasSchema = z
  .object({
    origemId: idSchema,
    destinoId: idSchema,
    valor: centavosPositivoSchema,
    data: dataSchema,
    descricao: z.string().trim().max(80, "Use até 80 caracteres"),
  })
  .refine((v) => v.origemId !== v.destinoId, { path: ["destinoId"], message: "Escolha contas diferentes" });
export type TransferenciaEntreContas = z.infer<typeof transferenciaEntreContasSchema>;

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
