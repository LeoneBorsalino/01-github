"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { useActiveEvent } from "@/lib/hooks/useEvents";
import { useProducts } from "@/lib/hooks/useProducts";
import { ProductEditModal } from "./ProductEditModal";
import type { ProductRow } from "@/lib/types";

export function ProductosClient() {
  const searchParams = useSearchParams();
  const { activeEvent, events } = useActiveEvent();
  const eventId = searchParams.get("eventId") ?? activeEvent?.id ?? events[0]?.id ?? null;
  const event = events.find((e) => e.id === eventId) ?? activeEvent;

  const { products, mutate } = useProducts(eventId);
  const [editing, setEditing] = useState<ProductRow | null | "new">(null);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, ProductRow[]>();
    for (const p of products) {
      const list = byCategory.get(p.category) ?? [];
      list.push(p);
      byCategory.set(p.category, list);
    }
    for (const list of byCategory.values()) list.sort((a, b) => a.sort_order - b.sort_order);
    return [...byCategory.entries()].sort((a, b) => a[1][0].sort_order - b[1][0].sort_order);
  }, [products]);

  const nextSortOrder = products.length > 0 ? Math.max(...products.map((p) => p.sort_order)) + 1 : 1;

  if (!eventId) {
    return <p className="p-6 text-slate-400">Creá un evento primero para poder cargar productos.</p>;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Productos y precios — {event?.name}</h2>
        <button onClick={() => setEditing("new")} className="btn-big bg-organizador px-5 text-base text-white">
          + Nuevo producto
        </button>
      </div>

      {grouped.map(([category, items]) => (
        <section key={category} className="mb-5">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{category}</h3>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Producto</th>
                  <th className="px-3 py-2">Precio</th>
                  <th className="px-3 py-2">Sector econ.</th>
                  <th className="px-3 py-2">Sector prep.</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold">{p.name}</td>
                    <td className="px-3 py-2">{formatMoney(p.price)}</td>
                    <td className="px-3 py-2">{p.sector_economico}</td>
                    <td className="px-3 py-2">{p.sector_preparacion}</td>
                    <td className="px-3 py-2">
                      {p.track_stock ? (
                        <span className={p.stock_qty <= p.low_stock_threshold ? "font-bold text-amber-600" : ""}>
                          {p.stock_qty}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {p.active ? (
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
                        onClick={() => setEditing(p)}
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
        </section>
      ))}

      {products.length === 0 && <p className="text-slate-400">No hay productos cargados todavía.</p>}

      {editing !== null && eventId && (
        <ProductEditModal
          eventId={eventId}
          product={editing === "new" ? null : editing}
          nextSortOrder={nextSortOrder}
          onClose={() => setEditing(null)}
          onSaved={() => mutate()}
        />
      )}
    </div>
  );
}
