"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

let cliente: ReturnType<typeof createBrowserClient> | undefined;

/** Cliente do Supabase para Client Components (uma instância por aba). */
export function supabaseNavegador() {
  if (!cliente) {
    const { url, chave } = supabaseEnv();
    cliente = createBrowserClient(url, chave);
  }
  return cliente;
}
