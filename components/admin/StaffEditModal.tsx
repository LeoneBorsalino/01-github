"use client";
import { useState } from "react";
import { apiPost, ApiError } from "@/lib/fetcher";
import type { StaffRole, StaffRow } from "@/lib/types";

async function patchStaff(id: string, body: unknown) {
  const res = await fetch(`/api/staff/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.error ?? "Error", res.status);
  return json;
}

const ROLES: StaffRole[] = ["CAJA", "FRIO", "CALIENTE", "ADMIN"];

export function StaffEditModal({
  staff,
  onClose,
  onSaved,
}: {
  staff: StaffRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = staff === null;
  const [name, setName] = useState(staff?.name ?? "");
  const [role, setRole] = useState<StaffRole>(staff?.role ?? "CAJA");
  const [pin, setPin] = useState("");
  const [active, setActive] = useState(staff?.active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError("Ingresá un nombre");
      return;
    }
    if (isNew && !/^\d{4}$/.test(pin)) {
      setError("El PIN debe tener exactamente 4 dígitos");
      return;
    }
    if (!isNew && pin && !/^\d{4}$/.test(pin)) {
      setError("El PIN debe tener exactamente 4 dígitos");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isNew) {
        await apiPost("/api/staff", { name: name.trim(), role, pin });
      } else {
        await patchStaff(staff.id, { name: name.trim(), role, active, ...(pin ? { pin } : {}) });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="mb-3 text-lg font-bold text-slate-800">
          {isNew ? "+ Nueva persona" : `Editar: ${staff.name}`}
        </h3>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-600">Nombre</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-slate-300 p-3"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-600">Sector / rol</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="rounded-xl border border-slate-300 p-3"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-600">
              {isNew ? "PIN (4 dígitos)" : "Nuevo PIN (dejar vacío para no cambiarlo)"}
            </span>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              className="rounded-xl border border-slate-300 p-3 tracking-widest"
              placeholder="••••"
            />
          </label>
          {!isNew && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-5 w-5"
              />
              <span className="text-sm font-semibold text-slate-600">Activo (puede iniciar sesión)</span>
            </label>
          )}
        </div>

        {error && <p className="mt-3 font-semibold text-peligro">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-600"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 rounded-xl bg-organizador py-3 font-bold text-white"
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
