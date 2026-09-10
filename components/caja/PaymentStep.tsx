"use client";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import type { PaymentMethod } from "@/lib/types";

const METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: "EFECTIVO", label: "EFECTIVO", emoji: "💵" },
  { value: "TRANSFERENCIA", label: "TRANSFERENCIA", emoji: "📲" },
  { value: "DEBITO", label: "DÉBITO / POSNET", emoji: "💳" },
  { value: "CORTESIA", label: "CORTESÍA (staff/músicos)", emoji: "🎁" },
];

export function PaymentStep({
  total,
  feriante,
  loading,
  errorMessage,
  onBack,
  onConfirm,
}: {
  /** Total del carrito SIN descuento (el feriante ya se muestra aparte). */
  total: number;
  feriante: boolean;
  loading: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onConfirm: (method: PaymentMethod) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod | null>(null);

  const isCortesia = method === "CORTESIA";
  const totalToShow = isCortesia ? 0 : feriante ? Math.round(total * 0.8) : total;

  return (
    <div className="flex h-full flex-col items-center gap-6 p-6">
      <button onClick={onBack} className="self-start font-semibold text-slate-500">
        ← Volver al pedido
      </button>

      <p className="text-lg font-semibold text-slate-500">Total a cobrar</p>
      <p className="text-5xl font-extrabold text-slate-900">{formatMoney(totalToShow)}</p>
      {feriante && !isCortesia && (
        <p className="-mt-4 text-sm font-semibold text-amber-600">🏷️ Con descuento feriante -20%</p>
      )}
      {isCortesia && (
        <p className="-mt-4 max-w-md text-center text-sm font-semibold text-slate-500">
          Se registra a $0 y queda separado en el cierre para cobrárselo al festival aparte.
        </p>
      )}

      <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
        {METHODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMethod(m.value)}
            className={`btn-big flex-col gap-1 py-6 text-lg ${
              method === m.value
                ? "bg-organizador text-white ring-4 ring-organizador-dark"
                : "bg-white ring-1 ring-slate-200 text-slate-700"
            }`}
          >
            <span className="text-3xl">{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>

      {errorMessage && (
        <p className="max-w-md text-center font-semibold text-peligro">{errorMessage}</p>
      )}

      <button
        onClick={() => method && onConfirm(method)}
        disabled={!method || loading}
        className="btn-big w-full max-w-md bg-organizador text-xl text-white"
      >
        {loading ? "Confirmando…" : "CONFIRMAR COBRO"}
      </button>
    </div>
  );
}
