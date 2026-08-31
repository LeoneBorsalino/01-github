"use client";
import Link from "next/link";
import { useEvents } from "@/lib/hooks/useEvents";
import type { EventStatus } from "@/lib/types";

const STATUS_LABEL: Record<EventStatus, string> = {
  BORRADOR: "Borrador",
  ACTIVO: "Activo",
  CERRADO: "Cerrado",
};
const STATUS_COLOR: Record<EventStatus, string> = {
  BORRADOR: "bg-slate-200 text-slate-600",
  ACTIVO: "bg-organizador-bg text-organizador-dark",
  CERRADO: "bg-slate-700 text-white",
};

export default function EventosPage() {
  const { events, isLoading } = useEvents();

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Eventos</h2>
        <Link href="/admin/eventos/nuevo" className="btn-big bg-organizador px-5 text-base text-white">
          + Crear nuevo evento
        </Link>
      </div>

      {isLoading && <p className="text-slate-400">Cargando…</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link key={event.id} href={`/admin/eventos/${event.id}`} className="card block hover:ring-2 hover:ring-slate-300">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-800">{event.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_COLOR[event.status]}`}>
                {STATUS_LABEL[event.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {new Date(`${event.date}T00:00:00`).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
            <p className="text-sm text-slate-500">{event.location}</p>
          </Link>
        ))}
        {!isLoading && events.length === 0 && (
          <p className="text-slate-400">Todavía no hay eventos creados.</p>
        )}
      </div>
    </div>
  );
}
