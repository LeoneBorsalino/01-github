"use client";
import { useEffect } from "react";
import { supabaseBrowser } from "../supabase/client";

/**
 * Se suscribe a cambios (`postgres_changes`) de una tabla y ejecuta
 * `onChange` en cada INSERT/UPDATE/DELETE. No trae los datos nuevos: quien
 * use el hook decide si revalida (SWR `mutate`) o parchea el estado local —
 * así mantenemos una sola fuente de verdad (la consulta REST) y Realtime
 * solo actúa como "aviso" de que algo cambió.
 */
export function useSupabaseSubscription(
  table: string,
  onChange: () => void,
  options?: { filter?: string; enabled?: boolean }
) {
  const filter = options?.filter;
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`${table}-${filter ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, enabled]);
}
