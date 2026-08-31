"use client";
import useSWR from "swr";
import { fetcher } from "../fetcher";
import { useSupabaseSubscription } from "./useSupabaseSubscription";
import type { OrderWithItems } from "../types";

/**
 * Pedidos de un evento (con sus ítems). Usado por Caja (para el próximo
 * número visible), Frío, Caliente y el Monitor de Admin. Se re-suscribe por
 * `event_id` y, ante CUALQUIER cambio en `orders` de ese evento (nuevo
 * cobro, cambio de estado, anulación), revalida el listado completo — así
 * los ítems (que no tienen event_id propio) siempre quedan consistentes.
 */
export function useOrders(eventId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<OrderWithItems[]>(
    eventId ? `/api/orders?eventId=${eventId}` : null,
    fetcher,
    { refreshInterval: 15_000 }
  );

  useSupabaseSubscription("orders", () => mutate(), {
    filter: eventId ? `event_id=eq.${eventId}` : undefined,
    enabled: Boolean(eventId),
  });

  return { orders: data ?? [], error, isLoading, mutate };
}
