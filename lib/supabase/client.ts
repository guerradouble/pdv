// lib/supabase/client.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Diagnóstico: se faltar algo, grita no console do browser
  if (!url || !anon) {
    console.error("[Supabase] Variáveis faltando!",
      { url, hasAnonKey: Boolean(anon) }
    );
  } else {
    // Log discreto pra checar rapidamente em prod (1x por load)
    if (typeof window !== "undefined" && !window.__supaLogged) {
      console.log("[Supabase] URL:", url);
      (window as any).__supaLogged = true;
    }
  }

  client = createBrowserClient(url!, anon!);
  return client;
}
