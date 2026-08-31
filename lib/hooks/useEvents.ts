"use client";
import useSWR from "swr";
import { fetcher } from "../fetcher";
import { useSupabaseSubscription } from "./useSupabaseSubscription";
import type { EventRow } from "../types";

export function useEvents() {
  const { data, error, isLoading, mutate } = useSWR<EventRow[]>("/api/events", fetcher, {
    refreshInterval: 60_000, // red de seguridad además de realtime
  });

  useSupabaseSubscription("events", () => mutate());

  return { events: data ?? [], error, isLoading, mutate };
}

export function useActiveEvent() {
  const { events, error, isLoading, mutate } = useEvents();
  const activeEvent = events.find((e) => e.status === "ACTIVO") ?? null;
  return { activeEvent, events, error, isLoading, mutate };
}
