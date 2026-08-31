"use client";
import useSWR from "swr";
import { fetcher } from "../fetcher";
import type { SessionPayload } from "../types";

export function useSession() {
  const { data, error, isLoading } = useSWR<SessionPayload>("/api/auth/me", fetcher, {
    shouldRetryOnError: false,
  });
  return { session: data ?? null, error, isLoading };
}
