"use client";
import { formatMoney } from "@/lib/money";

export function OrderSuccess({
  orderNumber,
  total,
  discountLabel,
  onNewOrder,
}: {
  orderNumber: number;
  total: number;
  discountLabel?: string | null;
  onNewOrder: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-organizador-bg p-6 text-center">
      <p className="text-xl font-semibold text-organizador-dark">Pedido cobrado</p>
      <p className="text-8xl font-black tabular-nums text-organizador-dark">
        #{String(orderNumber).padStart(3, "0")}
      </p>
      <p className="text-2xl font-bold text-slate-700">{formatMoney(total)}</p>
      {discountLabel && (
        <p className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">
          {discountLabel}
        </p>
      )}
      <button
        onClick={onNewOrder}
        className="btn-big mt-4 bg-organizador px-10 text-xl text-white"
      >
        NUEVO PEDIDO
      </button>
    </div>
  );
}
