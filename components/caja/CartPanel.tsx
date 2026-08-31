"use client";
import { formatMoney } from "@/lib/money";
import type { CartItem } from "@/lib/types";

export function CartPanel({
  items,
  total,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onCheckout,
}: {
  items: CartItem[];
  total: number;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}) {
  return (
    <aside className="flex h-full flex-col border-slate-200 bg-white lg:border-l">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-lg font-bold text-slate-800">Pedido</h2>
        {items.length > 0 && (
          <button onClick={onClear} className="text-sm font-semibold text-peligro">
            Vaciar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {items.length === 0 ? (
          <p className="mt-8 text-center text-slate-400">Tocá un producto para agregarlo</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center gap-2 rounded-xl bg-slate-50 p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatMoney(item.unitPrice)} c/u — {formatMoney(item.unitPrice * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDecrement(item.productId)}
                    className="h-9 w-9 rounded-lg bg-slate-200 text-lg font-bold text-slate-700 active:scale-95"
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-bold text-slate-800">{item.quantity}</span>
                  <button
                    onClick={() => onIncrement(item.productId)}
                    className="h-9 w-9 rounded-lg bg-slate-200 text-lg font-bold text-slate-700 active:scale-95"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemove(item.productId)}
                    className="ml-1 h-9 w-9 rounded-lg bg-peligro-bg text-peligro active:scale-95"
                    aria-label="Eliminar producto"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-600">TOTAL</span>
          <span className="text-2xl font-extrabold text-slate-900">{formatMoney(total)}</span>
        </div>
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="btn-big w-full bg-organizador text-xl text-white"
        >
          COBRAR
        </button>
      </div>
    </aside>
  );
}
