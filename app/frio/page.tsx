"use client";
import { TopBar } from "@/components/TopBar";
import { PrepScreen } from "@/components/PrepScreen";
import { useActiveEvent } from "@/lib/hooks/useEvents";
import { useOrders } from "@/lib/hooks/useOrders";

export default function FrioPage() {
  const { activeEvent, isLoading } = useActiveEvent();
  const { orders, mutate } = useOrders(activeEvent?.id);

  if (isLoading) {
    return <div className="flex min-h-dvh items-center justify-center text-slate-400">Cargando…</div>;
  }

  if (!activeEvent) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title="🧊 FRÍO" accentClassName="bg-frio" />
        <div className="flex flex-1 items-center justify-center p-6 text-center text-lg font-semibold text-slate-500">
          No hay ningún evento activo todavía.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar title="🧊 FRÍO" accentClassName="bg-frio" eventName={activeEvent.name} />
      <PrepScreen
        sector="FRIO"
        accentClassName="border-l-frio"
        orders={orders}
        onChanged={() => mutate()}
      />
    </div>
  );
}
