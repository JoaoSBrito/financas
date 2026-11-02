import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

// /api/cron se protege com o CRON_SECRET, não com sessão.
const ROTAS_PUBLICAS = ["/entrar", "/auth", "/api/cron"];

/** Renova a sessão a cada requisição e manda para /entrar quem não está logado. */
export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  const { url, chave } = supabaseEnv();

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) request.cookies.set(name, value);
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of lista) resposta.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims);
  const publica = ROTAS_PUBLICAS.some((r) => request.nextUrl.pathname.startsWith(r));

  if (!logado && !publica) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    return NextResponse.redirect(destino);
  }
  return resposta;
}
