"use client";
import { useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { generalOrderStatus, GENERAL_STATUS_LABEL, GENERAL_STATUS_COLOR, PREP_STATUS_LABEL } from "@/lib/orderStatus";
import { useActiveEvent } from "@/lib/hooks/useEvents";
import { useOrders } from "@/lib/hooks/useOrders";
import { VoidOrderModal } from "@/components/admin/VoidOrderModal";
import type { OrderRow } from "@/lib/types";

export default function AdminMonitorPage() {
  const { activeEvent, isLoading } = useActiveEvent();
  const { orders, mutate } = useOrders(activeEvent?.id);
  const [voiding, setVoiding] = useState<OrderRow | null>(null);

  if (isLoading) return <p className="p-6 text-slate-400">Cargando…</p>;

  if (!activeEvent) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4 text-lg font-semibold text-slate-500">No hay ningún evento activo.</p>
        <Link href="/admin/eventos" className="btn-big inline-flex bg-slate-800 px-6 text-white">
          Ir a Eventos
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="mb-3 text-xl font-bold text-slate-800">Monitor general — {activeEvent.name}</h2>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Pedido</th>
              <th className="px-3 py-2">Hora</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Pago</th>
              <th className="px-3 py-2">Frío</th>
              <th className="px-3 py-2">Caliente</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const general = generalOrderStatus(order);
              return (
                <tr key={order.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-bold">#{String(order.order_number).padStart(3, "0")}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(order.charged_at).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 font-semibold">{formatMoney(order.total)}</td>
                  <td className="px-3 py-2">{order.payment_method}</td>
                  <td className="px-3 py-2">
                    {order.sector_frio_status ? PREP_STATUS_LABEL[order.sector_frio_status] : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {order.sector_caliente_status ? PREP_STATUS_LABEL[order.sector_caliente_status] : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${GENERAL_STATUS_COLOR[general]}`}>
                      {GENERAL_STATUS_LABEL[general]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {order.status === "COBRADO" ? (
                      <button
                        onClick={() => setVoiding(order)}
                        className="rounded-lg bg-peligro-bg px-2 py-1 text-xs font-bold text-peligro"
                      >
                        Anular
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400" title={order.void_reason ?? undefined}>
                        Anulado por {order.voided_by_name ?? "—"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                  Todavía no hay pedidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {voiding && (
        <VoidOrderModal order={voiding} onClose={() => setVoiding(null)} onVoided={() => mutate()} />
      )}
    </div>
  );
}
