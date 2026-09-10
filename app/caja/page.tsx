"use client";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { ProductGrid } from "@/components/caja/ProductGrid";
import { CartPanel } from "@/components/caja/CartPanel";
import { PaymentStep } from "@/components/caja/PaymentStep";
import { OrderSuccess } from "@/components/caja/OrderSuccess";
import { useActiveEvent } from "@/lib/hooks/useEvents";
import { useProducts } from "@/lib/hooks/useProducts";
import { useCart } from "@/lib/hooks/useCart";
import { apiPost, ApiError } from "@/lib/fetcher";
import type { OrderRow, PaymentMethod } from "@/lib/types";

type Step = "catalog" | "payment" | "success";

export default function CajaPage() {
  const { activeEvent, isLoading: loadingEvent } = useActiveEvent();
  const { products } = useProducts(activeEvent?.id);
  const cart = useCart(activeEvent?.id);

  const [step, setStep] = useState<Step>("catalog");
  const [feriante, setFeriante] = useState(false);
  const [charging, setCharging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<OrderRow | null>(null);

  async function confirmCharge(method: PaymentMethod) {
    if (!activeEvent) return;
    setCharging(true);
    setError(null);
    try {
      const order = await apiPost<OrderRow>("/api/orders/charge", {
        eventId: activeEvent.id,
        paymentMethod: method,
        feriante,
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      setLastOrder(order);
      cart.clear();
      setFeriante(false);
      setStep("success");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo confirmar el cobro");
    } finally {
      setCharging(false);
    }
  }

  if (loadingEvent) {
    return <div className="flex min-h-dvh items-center justify-center text-slate-400">Cargando…</div>;
  }

  if (!activeEvent) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title="💰 CAJA" accentClassName="bg-organizador" />
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <p className="text-lg font-semibold text-slate-500">
            No hay ningún evento activo todavía.
            <br />
            Pedile al administrador que inicie el evento desde el panel de Admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar title="💰 CAJA" accentClassName="bg-organizador" eventName={activeEvent.name} />

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_380px]">
        {step === "catalog" && (
          <>
            <div className="overflow-y-auto">
              <ProductGrid products={products} onSelect={(p) => cart.addProduct(p)} />
            </div>
            <CartPanel
              items={cart.items}
              total={cart.total}
              feriante={feriante}
              onToggleFeriante={() => setFeriante((f) => !f)}
              onIncrement={cart.increment}
              onDecrement={cart.decrement}
              onRemove={cart.removeItem}
              onClear={() => {
                cart.clear();
                setFeriante(false);
              }}
              onCheckout={() => {
                setError(null);
                setStep("payment");
              }}
            />
          </>
        )}

        {step === "payment" && (
          <div className="col-span-full overflow-y-auto">
            <PaymentStep
              total={cart.total}
              feriante={feriante}
              loading={charging}
              errorMessage={error}
              onBack={() => setStep("catalog")}
              onConfirm={confirmCharge}
            />
          </div>
        )}

        {step === "success" && lastOrder && (
          <div className="col-span-full overflow-y-auto">
            <OrderSuccess
              orderNumber={lastOrder.order_number}
              total={lastOrder.total}
              discountLabel={lastOrder.discount_label}
              onNewOrder={() => setStep("catalog")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
