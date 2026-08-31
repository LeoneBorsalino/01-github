import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la clave `service_role`: ignora RLS por completo.
 * Solo se importa desde Route Handlers / código server-side. `server-only`
 * hace que el build falle si algún componente cliente intenta importarlo.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
