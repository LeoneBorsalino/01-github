"use client";
import { useEvents } from "@/lib/hooks/useEvents";
import { HistorialRow } from "@/components/admin/HistorialRow";

export default function HistorialPage() {
  const { events, isLoading } = useEvents();
  const closed = events.filter((e) => e.status === "CERRADO");

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold text-slate-800">Historial de eventos</h2>
      {isLoading && <p className="text-slate-400">Cargando…</p>}
      {!isLoading && closed.length === 0 && (
        <p className="text-slate-400">Todavía no hay eventos cerrados.</p>
      )}
      {closed.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Evento</th>
                <th className="px-3 py-2">Facturación total</th>
                <th className="px-3 py-2">Frío</th>
                <th className="px-3 py-2">Caliente</th>
                <th className="px-3 py-2">70% caliente</th>
                <th className="px-3 py-2">30% caliente</th>
                <th className="px-3 py-2">Total organizador</th>
                <th className="px-3 py-2">Efectivo</th>
                <th className="px-3 py-2">Transferencia</th>
                <th className="px-3 py-2">Débito</th>
                <th className="px-3 py-2">Pedidos</th>
                <th className="px-3 py-2">Anulaciones</th>
              </tr>
            </thead>
            <tbody>
              {closed.map((event) => (
                <HistorialRow key={event.id} event={event} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
