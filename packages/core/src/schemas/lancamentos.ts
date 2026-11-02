import { z } from "zod";
import { centavosPositivoSchema, centavosSchema, dataSchema, idSchema, mesSchema, textoCurto } from "./comuns";

export const novoGastoSchema = z.object({
  valor: centavosPositivoSchema,
  descricao: textoCurto(80, "uma descrição"),
  cartaoId: idSchema,
  categoriaId: idSchema.nullable(),
  dataCompra: dataSchema,
  parcelas: z.number().int().min(1).max(48, "Máximo de 48 parcelas"),
});
export type NovoGasto = z.infer<typeof novoGastoSchema>;

export const parcelamentoEmAndamentoSchema = z
  .object({
    descricao: textoCurto(80, "uma descrição"),
    cartaoId: idSchema,
    categoriaId: idSchema.nullable(),
    valorParcela: centavosPositivoSchema,
    totalParcelas: z
      .number({ error: "Informe o total de parcelas" })
      .int()
      .min(2, "Mínimo de 2 parcelas")
      .max(48, "Máximo de 48 parcelas"),
    parcelaAtual: z.number().int().min(1),
    /** Fatura (mês do vencimento) em que a parcela atual aparece. */
    mesFatura: mesSchema,
  })
  .refine((v) => v.parcelaAtual <= v.totalParcelas, {
    path: ["parcelaAtual"],
    message: "A parcela atual não pode passar do total",
  });
export type ParcelamentoEmAndamento = z.infer<typeof parcelamentoEmAndamentoSchema>;

/** Fatura aberta no início do uso, informada como um valor único sem categoria. */
export const saldoInicialFaturaSchema = z.object({
  cartaoId: idSchema,
  valor: centavosPositivoSchema,
  /** Fatura (mês do vencimento) que recebe o saldo. */
  mesFatura: mesSchema,
});
export type SaldoInicialFatura = z.infer<typeof saldoInicialFaturaSchema>;

export const contaFormSchema = z.object({
  nome: textoCurto(40, "o nome da conta"),
  tipo: z.enum(["corrente", "carteira", "outra"]),
  saldoAtual: centavosSchema,
});
export type ContaForm = z.infer<typeof contaFormSchema>;

export const movimentoFormSchema = z.object({
  contaId: idSchema,
  tipo: z.enum(["entrada", "saida"]),
  valor: centavosPositivoSchema,
  descricao: textoCurto(80, "uma descrição"),
  data: dataSchema,
  categoriaId: idSchema.nullable(),
});
export type MovimentoForm = z.infer<typeof movimentoFormSchema>;

export const ajusteSaldoSchema = z.object({
  contaId: idSchema,
  saldoReal: centavosSchema,
});
export type AjusteSaldo = z.infer<typeof ajusteSaldoSchema>;

export const recorrenteFormSchema = z
  .object({
    descricao: textoCurto(80, "uma descrição"),
    tipo: z.enum(["entrada", "saida"]),
    valor: centavosPositivoSchema,
    dia: z.number().int().min(1).max(31),
    contaId: idSchema.nullable(),
    cartaoId: idSchema.nullable(),
    categoriaId: idSchema.nullable(),
  })
  .refine((v) => (v.contaId === null) !== (v.cartaoId === null), {
    path: ["contaId"],
    message: "Escolha uma conta ou um cartão",
  });
export type RecorrenteForm = z.infer<typeof recorrenteFormSchema>;
