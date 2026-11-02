import { z } from "zod";

/** Remove espaços e aspas que às vezes vêm junto ao colar o valor no painel da Vercel. */
const limpar = (v: unknown) => (typeof v === "string" ? v.trim().replace(/^["']|["']$/g, "") : v);

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    limpar,
    z
      .url("NEXT_PUBLIC_SUPABASE_URL deve ser a Project URL, ex.: https://xxxx.supabase.co")
      .refine((u) => u.startsWith("https://"), "NEXT_PUBLIC_SUPABASE_URL deve começar com https://")
      // Descarta caminhos como /rest/v1: o cliente do Supabase precisa só do domínio.
      .transform((u) => new URL(u).origin),
  ),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.preprocess(
    limpar,
    z.string().min(20, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY parece vazia ou incompleta"),
  ),
});

export function supabaseEnv() {
  // Acesso direto (não dinâmico) para o Next.js embutir as variáveis no código do navegador.
  const r = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!r.success) {
    throw new Error(`Configuração do Supabase inválida: ${r.error.issues.map((i) => i.message).join("; ")}`);
  }
  return { url: r.data.NEXT_PUBLIC_SUPABASE_URL, chave: r.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
}
