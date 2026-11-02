import { z } from "zod";
import type { Cartao, RegraFechamento } from "../fatura";
import { centavosPositivoSchema, textoCurto } from "./comuns";

export const regraFechamentoSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("dia_fixo"),
    dia: z.number({ error: "Informe o dia" }).int().min(1, "Dia entre 1 e 31").max(31, "Dia entre 1 e 31"),
  }),
  z.object({
    tipo: z.literal("dias_antes"),
    dias: z.number().int().min(1, "Mínimo de 1 dia").max(20, "Máximo de 20 dias"),
    contagem: z.enum(["uteis", "corridos"]),
  }),
  z.object({ tipo: z.literal("manual") }),
]);

export const cartaoFormSchema = z.object({
  nome: textoCurto(40, "o apelido do cartão"),
  final: z
    .string()
    .regex(/^\d{4}$/, "Use os 4 últimos dígitos")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  limite: centavosPositivoSchema,
  diaVencimento: z.number({ error: "Informe o dia" }).int().min(1, "Dia entre 1 e 31").max(31, "Dia entre 1 e 31"),
  vencimentoNaoUtil: z.enum(["proximo_dia_util", "mantem"]),
  fechamento: regraFechamentoSchema,
  avisarAntesDoFechamento: z.boolean(),
  pedirConfirmacaoMensal: z.boolean(),
});

export type CartaoForm = z.infer<typeof cartaoFormSchema>;

// Garante em tempo de compilação que o schema e o tipo do domínio não divergem.
type _RegraCompativel = z.infer<typeof regraFechamentoSchema> extends RegraFechamento ? true : never;
const _regraOk: _RegraCompativel = true;
void _regraOk;

export function cartaoDoFormulario(id: string, f: CartaoForm): Cartao {
  return {
    id,
    diaVencimento: f.diaVencimento,
    vencimentoNaoUtil: f.vencimentoNaoUtil,
    fechamento: f.fechamento,
  };
}
