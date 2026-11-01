import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/** Cliente do Supabase para Server Components e rotas. Crie um por requisição. */
export async function supabaseServidor() {
  const { url, chave } = supabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(url, chave, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) cookieStore.set(name, value, options);
        } catch {
          // Em Server Components não dá para gravar cookies; o proxy renova a sessão.
        }
      },
    },
  });
}
