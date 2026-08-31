"use client";
import useSWR from "swr";
import { fetcher } from "../fetcher";
import { useSupabaseSubscription } from "./useSupabaseSubscription";
import type { ProductRow } from "../types";

export function useProducts(eventId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<ProductRow[]>(
    eventId ? `/api/products?eventId=${eventId}` : null,
    fetcher,
    { refreshInterval: 60_000 }
  );

  useSupabaseSubscription("products", () => mutate(), {
    filter: eventId ? `event_id=eq.${eventId}` : undefined,
    enabled: Boolean(eventId),
  });

  return { products: data ?? [], error, isLoading, mutate };
}
