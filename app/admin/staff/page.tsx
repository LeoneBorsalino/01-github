"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { StaffEditModal } from "@/components/admin/StaffEditModal";
import type { StaffRow } from "@/lib/types";

export default function StaffPage() {
  const { data: staff, isLoading, mutate } = useSWR<StaffRow[]>("/api/staff", fetcher);
  const [editing, setEditing] = useState<StaffRow | null | "new">(null);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Staff / PINs de acceso</h2>
        <button onClick={() => setEditing("new")} className="btn-big bg-organizador px-5 text-base text-white">
          + Nueva persona
        </button>
      </div>

      {isLoading && <p className="text-slate-400">Cargando…</p>}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Sector</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(staff ?? []).map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold">{s.name}</td>
                <td className="px-3 py-2">{s.role}</td>
                <td className="px-3 py-2">
                  {s.active ? (
                    <span className="rounded-full bg-organizador-bg px-2 py-0.5 text-xs font-bold text-organizador-dark">
                      Activo
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-500">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setEditing(s)}
                    className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <StaffEditModal
          staff={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => mutate()}
        />
      )}
    </div>
  );
}
