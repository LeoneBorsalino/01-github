"use client";
import { useState } from "react";
import Link from "next/link";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher, apiPost, ApiError } from "@/lib/fetcher";
import type { EventRow } from "@/lib/types";

const STATUS_LABEL: Record<EventRow["status"], string> = {
  BORRADOR: "Borrador",
  ACTIVO: "Activo",
  CERRADO: "Cerrado",
};

export default function EventoDetailPage({ params }: { params: { id: string } }) {
  const key = `/api/events/${params.id}`;
  const { data: event, mutate, isLoading } = useSWR<EventRow>(key, fetcher);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshAll() {
    await mutate();
    await globalMutate("/api/events");
  }

  async function start() {
    if (!confirm("¿Iniciar este evento? Se habilitarán las ventas y la numeración arrancará en #001.")) return;
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/api/events/${params.id}/start`);
      await refreshAll();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo iniciar el evento");
    } finally {
      setBusy(false);
    }
  }

  async function close() {
    if (
      !confirm(
        "¿Cerrar este evento? Se bloquearán nuevas ventas. El historial y el cierre de caja quedan disponibles para siempre."
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/api/events/${params.id}/close`);
      await refreshAll();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo cerrar el evento");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !event) return <p className="p-6 text-slate-400">Cargando…</p>;

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{event.name}</h2>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-700">
          {STATUS_LABEL[event.status]}
        </span>
      </div>

      <div className="card mb-4 flex flex-col gap-1 text-slate-600">
        <p>
          <strong>Fecha:</strong> {event.date}
        </p>
        <p>
          <strong>Lugar:</strong> {event.location}
        </p>
        {event.description && (
          <p>
            <strong>Descripción:</strong> {event.description}
          </p>
        )}
        <p>
          <strong>Pedidos hasta ahora:</strong> #{String(event.order_counter).padStart(3, "0")}
        </p>
      </div>

      {error && <p className="mb-3 font-semibold text-peligro">{error}</p>}

      <div className="flex flex-col gap-3">
        {event.status === "BORRADOR" && (
          <button disabled={busy} onClick={start} className="btn-big bg-organizador text-lg text-white">
            ▶ Iniciar evento
          </button>
        )}
        {event.status === "ACTIVO" && (
          <button disabled={busy} onClick={close} className="btn-big bg-peligro text-lg text-white">
            🔒 Cerrar evento
          </button>
        )}

        <Link
          href={`/admin/productos?eventId=${event.id}`}
          className="btn-big bg-white text-base text-slate-700 ring-1 ring-slate-200"
        >
          ⚙️ Productos y precios
        </Link>
        <Link
          href={`/admin/cierre?eventId=${event.id}`}
          className="btn-big bg-white text-base text-slate-700 ring-1 ring-slate-200"
        >
          📊 Ver cierre de caja
        </Link>
      </div>
    </div>
  );
}
