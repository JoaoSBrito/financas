import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { hojeEmSaoPaulo, somarDias } from "@financas/core";
import { supabaseAdmin } from "@/servidor/admin";
import { interpretarSerieCdi, planejarRendimentos, urlSerieCdi } from "@/servidor/cdi";

export const dynamic = "force-dynamic";

/**
 * Tarefa diária (Vercel Cron):
 * 1. busca as taxas DI dos últimos 30 dias no Banco Central e guarda em taxas_cdi;
 * 2. lança o rendimento estimado das caixinhas com % do CDI.
 */
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const hoje = hojeEmSaoPaulo();
  const admin = supabaseAdmin();

  // 1. Taxas do BCB
  const resposta = await fetch(urlSerieCdi(somarDias(hoje, -30), hoje), { cache: "no-store" });
  if (!resposta.ok) return NextResponse.json({ erro: `BCB respondeu ${resposta.status}` }, { status: 502 });
  const novas = interpretarSerieCdi(await resposta.json());
  if (novas.length > 0) {
    const { error } = await admin.from("taxas_cdi").upsert(novas.map((t) => ({ data: t.data, taxa_dia: t.taxaDia })));
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  // 2. Caixinhas com % do CDI
  const { data: brutas, error: e1 } = await admin
    .from("caixinhas")
    .select("id, user_id, percentual_cdi, rendimento_calculado_ate")
    .eq("arquivada", false)
    .not("percentual_cdi", "is", null);
  if (e1) return NextResponse.json({ erro: e1.message }, { status: 500 });
  const caixinhas = z
    .object({ id: z.uuid(), user_id: z.uuid(), percentual_cdi: z.coerce.number(), rendimento_calculado_ate: z.string().nullable() })
    .array()
    .parse(brutas);

  const { data: saldos, error: e2 } = await admin.from("saldo_caixinhas").select("id, saldo");
  if (e2) return NextResponse.json({ erro: e2.message }, { status: 500 });
  const saldoPorId = new Map(z.object({ id: z.uuid(), saldo: z.number() }).array().parse(saldos).map((s) => [s.id, s.saldo]));

  const desde = caixinhas.map((c) => c.rendimento_calculado_ate).filter(Boolean).sort()[0];
  const { data: taxasBrutas, error: e3 } = await admin
    .from("taxas_cdi")
    .select("data, taxa_dia")
    .gt("data", desde ?? hoje)
    .order("data");
  if (e3) return NextResponse.json({ erro: e3.message }, { status: 500 });
  const taxas = z
    .object({ data: z.string(), taxa_dia: z.coerce.number() })
    .array()
    .parse(taxasBrutas)
    .map((t) => ({ data: t.data, taxaDia: t.taxa_dia }));

  const plano = planejarRendimentos(
    caixinhas.map((c) => ({
      id: c.id,
      userId: c.user_id,
      saldo: saldoPorId.get(c.id) ?? 0,
      percentualCdi: c.percentual_cdi,
      calculadoAte: c.rendimento_calculado_ate,
    })),
    taxas,
    hoje,
  );

  for (const id of plano.iniciar) {
    await admin.from("caixinhas").update({ rendimento_calculado_ate: hoje }).eq("id", id);
  }
  for (const l of plano.lancamentos) {
    if (l.valor !== 0) {
      const { error } = await admin
        .from("caixinha_movimentos")
        .insert({ user_id: l.userId, caixinha_id: l.caixinhaId, data: l.ate, valor: l.valor, tipo: "rendimento_estimado" });
      if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    }
    await admin.from("caixinhas").update({ rendimento_calculado_ate: l.ate }).eq("id", l.caixinhaId);
  }

  return NextResponse.json({ taxas: novas.length, rendimentos: plano.lancamentos.length, iniciadas: plano.iniciar.length });
}
