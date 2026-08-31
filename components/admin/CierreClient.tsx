"use client";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useActiveEvent } from "@/lib/hooks/useEvents";
import { ClosingView } from "./ClosingView";
import type { ClosingResult } from "@/lib/closing";
import type { EventRow } from "@/lib/types";

export function CierreClient() {
  const searchParams = useSearchParams();
  const { activeEvent } = useActiveEvent();
  const eventId = searchParams.get("eventId") ?? activeEvent?.id ?? null;

  const { data, isLoading, mutate } = useSWR<{ event: EventRow; closing: ClosingResult }>(
    eventId ? `/api/events/${eventId}/cierre` : null,
    fetcher,
    { refreshInterval: 20_000 }
  );

  if (!eventId) {
    return <p className="p-6 text-slate-400">No hay ningún evento seleccionado.</p>;
  }
  if (isLoading || !data) {
    return <p className="p-6 text-slate-400">Calculando cierre…</p>;
  }

  return (
    <div className="p-4">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-xl font-bold text-slate-800">📊 Cierre de caja</h2>
        <button onClick={() => mutate()} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
          Actualizar
        </button>
        <a
          href={`/api/events/${eventId}/export?format=csv`}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"
        >
          Exportar CSV
        </a>
        <a
          href={`/api/events/${eventId}/export?format=xlsx`}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"
        >
          Exportar Excel
        </a>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white"
        >
          Imprimir / PDF
        </button>
      </div>

      <ClosingView event={data.event} closing={data.closing} />
    </div>
  );
}
