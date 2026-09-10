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
    // Nombre de canal único por cada suscriptor: si dos componentes escuchan
    // la misma tabla (p. ej. el layout de Admin y la página de Admin, ambos
    // usando useActiveEvent), Supabase reutiliza el canal existente si el
    // nombre coincide, y agregar un listener a un canal ya suscripto tira
    // "cannot add postgres_changes callbacks ... after subscribe()". Un
    // sufijo aleatorio evita esa colisión sin costo real (cada canal es una
    // suscripción independiente y liviana).
    const uniqueName = `${table}-${filter ?? "all"}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(uniqueName)
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
