"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEvents } from "@/lib/hooks/useEvents";
import { apiPost, ApiError } from "@/lib/fetcher";
import type { EventRow } from "@/lib/types";

export default function NuevoEventoPage() {
  const router = useRouter();
  const { events, mutate } = useEvents();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [copyFrom, setCopyFrom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date || !location.trim()) {
      setError("Nombre, fecha y lugar son obligatorios");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const event = await apiPost<EventRow>("/api/events", {
        name: name.trim(),
        date,
        location: location.trim(),
        description: description.trim() || null,
        copyFromEventId: copyFrom || null,
      });
      await mutate();
      router.push(`/admin/eventos/${event.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo crear el evento");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <h2 className="mb-4 text-xl font-bold text-slate-800">+ Crear nuevo evento</h2>
      <form onSubmit={submit} className="card flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-600">Nombre del evento</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-slate-300 p-3 text-base"
            placeholder="Ej: Fiesta de Primavera"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-600">Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-300 p-3 text-base"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-600">Lugar</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-xl border border-slate-300 p-3 text-base"
            placeholder="Ej: UNLAM"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-600">Descripción (opcional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="rounded-xl border border-slate-300 p-3 text-base"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-600">
            Copiar productos de un evento anterior (opcional)
          </span>
          <select
            value={copyFrom}
            onChange={(e) => setCopyFrom(e.target.value)}
            className="rounded-xl border border-slate-300 p-3 text-base"
          >
            <option value="">No copiar — empezar sin productos</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} ({ev.date})
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400">
            Copia nombres, precios y sectores como base. El stock se carga de cero para el evento nuevo.
          </span>
        </label>

        {error && <p className="font-semibold text-peligro">{error}</p>}

        <button disabled={loading} className="btn-big bg-organizador text-lg text-white">
          {loading ? "Creando…" : "Crear evento"}
        </button>
      </form>
    </div>
  );
}
