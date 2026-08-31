"use client";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para el browser: solo la clave `anon`, protegida por
 * RLS de solo-lectura (ver supabase/schema.sql). Se usa para suscripciones
 * Realtime y lecturas directas; toda escritura pasa por /api/*.
 */
let browserClient: ReturnType<typeof createClient> | null = null;

export function supabaseBrowser() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan variables de entorno públicas de Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }
  browserClient = createClient(url, key, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return browserClient;
}
