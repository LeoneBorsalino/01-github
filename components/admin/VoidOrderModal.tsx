"use client";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { apiPost, ApiError } from "@/lib/fetcher";
import type { OrderRow } from "@/lib/types";

export function VoidOrderModal({
  order,
  onClose,
  onVoided,
}: {
  order: OrderRow;
  onClose: () => void;
  onVoided: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!reason.trim()) {
      setError("Ingresá el motivo de la anulación");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiPost(`/api/orders/${order.id}/void`, { reason: reason.trim() });
      onVoided();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo anular el pedido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-slate-800">
          ⚠️ Anular pedido #{String(order.order_number).padStart(3, "0")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Total: {formatMoney(order.total)} — Medio de pago: {order.payment_method}
        </p>
        <p className="mt-3 text-sm font-semibold text-slate-600">Motivo de anulación</p>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-base"
          placeholder="Ej: el cliente se arrepintió, error de carga…"
        />
        {error && <p className="mt-2 text-sm font-semibold text-peligro">{error}</p>}
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
            className="flex-1 rounded-xl bg-peligro py-3 font-bold text-white"
          >
            {loading ? "Anulando…" : "Confirmar anulación"}
          </button>
        </div>
      </div>
    </div>
  );
}
