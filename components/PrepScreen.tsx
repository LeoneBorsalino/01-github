"use client";
import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/money";
import { generalOrderStatus, GENERAL_STATUS_LABEL, GENERAL_STATUS_COLOR } from "@/lib/orderStatus";
import { apiPost, ApiError } from "@/lib/fetcher";
import type { OrderWithItems, PrepStatus, Sector } from "@/lib/types";

const COLUMNS: { status: PrepStatus; label: string }[] = [
  { status: "PENDIENTE", label: "Pendiente" },
  { status: "EN_PREPARACION", label: "En preparación" },
  { status: "LISTO", label: "Listo" },
];

const NEXT_LABEL: Record<PrepStatus, string> = {
  PENDIENTE: "Empezar preparación",
  EN_PREPARACION: "Marcar listo ✓",
  LISTO: "",
};

function nextStatus(current: PrepStatus): PrepStatus | null {
  if (current === "PENDIENTE") return "EN_PREPARACION";
  if (current === "EN_PREPARACION") return "LISTO";
  return null;
}

function prevStatus(current: PrepStatus): PrepStatus | null {
  if (current === "LISTO") return "EN_PREPARACION";
  if (current === "EN_PREPARACION") return "PENDIENTE";
  return null;
}

export function PrepScreen({
  sector,
  accentClassName,
  orders,
  onChanged,
}: {
  sector: Sector;
  accentClassName: string;
  orders: OrderWithItems[];
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const relevant = useMemo(() => {
    const statusField = sector === "FRIO" ? "sector_frio_status" : "sector_caliente_status";
    return orders
      .filter((o) => o.status === "COBRADO" && o[statusField] !== null)
      .sort((a, b) => a.order_number - b.order_number);
  }, [orders, sector]);

  async function changeStatus(orderId: string, status: PrepStatus) {
    setBusyId(orderId);
    try {
      await apiPost(`/api/orders/${orderId}/status`, { sector, status });
      onChanged();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "No se pudo actualizar el estado");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 sm:grid-cols-3">
      {COLUMNS.map((col) => {
        const statusField = sector === "FRIO" ? "sector_frio_status" : "sector_caliente_status";
        const columnOrders = relevant.filter((o) => o[statusField] === col.status);
        return (
          <div key={col.status} className="flex flex-col gap-2">
            <h2 className="sticky top-0 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold uppercase tracking-wide text-slate-600">
              {col.label} ({columnOrders.length})
            </h2>
            {columnOrders.length === 0 && (
              <p className="px-2 text-sm text-slate-400">Sin pedidos</p>
            )}
            {columnOrders.map((order) => {
              const items = order.items.filter((i) => i.sector_preparacion === sector);
              const otherSectorPresent =
                sector === "FRIO" ? order.sector_caliente_status !== null : order.sector_frio_status !== null;
              const general = generalOrderStatus(order);
              const next = nextStatus(col.status);
              const prev = prevStatus(col.status);
              const busy = busyId === order.id;

              return (
                <div key={order.id} className={`card border-l-4 ${accentClassName}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-2xl font-black text-slate-800">
                      #{String(order.order_number).padStart(3, "0")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${GENERAL_STATUS_COLOR[general]}`}
                    >
                      {GENERAL_STATUS_LABEL[general]}
                    </span>
                  </div>
                  <ul className="mb-3 flex flex-col gap-1">
                    {items.map((item) => (
                      <li key={item.id} className="text-base font-semibold text-slate-700">
                        {item.quantity}× {item.product_name}
                      </li>
                    ))}
                  </ul>
                  {otherSectorPresent && (
                    <p className="mb-2 text-xs font-medium text-slate-400">
                      (pedido mixto — también tiene productos de otro sector)
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {next && (
                      <button
                        disabled={busy}
                        onClick={() => changeStatus(order.id, next)}
                        className="btn-big flex-1 bg-organizador py-3 text-base text-white"
                      >
                        {NEXT_LABEL[col.status]}
                      </button>
                    )}
                    {prev && (
                      <button
                        disabled={busy}
                        onClick={() => changeStatus(order.id, prev)}
                        className="rounded-xl bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-500"
                      >
                        ← volver
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
