"use client";
import { useMemo } from "react";
import { formatMoney } from "@/lib/money";
import type { ProductRow } from "@/lib/types";

export function ProductGrid({
  products,
  onSelect,
}: {
  products: ProductRow[];
  onSelect: (product: ProductRow) => void;
}) {
  const categories = useMemo(() => {
    const active = products.filter((p) => p.active);
    const byCategory = new Map<string, ProductRow[]>();
    for (const p of active) {
      const list = byCategory.get(p.category) ?? [];
      list.push(p);
      byCategory.set(p.category, list);
    }
    for (const list of byCategory.values()) list.sort((a, b) => a.sort_order - b.sort_order);
    return [...byCategory.entries()].sort(
      (a, b) => a[1][0].sort_order - b[1][0].sort_order
    );
  }, [products]);

  if (products.length === 0) {
    return <p className="p-6 text-center text-slate-400">No hay productos cargados para este evento.</p>;
  }

  return (
    <div className="flex flex-col gap-6 p-3 sm:p-4">
      {categories.map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-slate-500">
            {category}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => {
              const outOfStock = product.track_stock && product.stock_qty <= 0;
              const lowStock =
                product.track_stock &&
                !outOfStock &&
                product.stock_qty <= product.low_stock_threshold;
              return (
                <button
                  key={product.id}
                  onClick={() => onSelect(product)}
                  disabled={outOfStock}
                  className={`btn-big relative flex-col items-stretch gap-1 !justify-between p-4 text-left ${
                    product.sector_preparacion === "FRIO"
                      ? "bg-frio-bg ring-1 ring-frio/30"
                      : "bg-caliente-bg ring-1 ring-caliente/30"
                  }`}
                >
                  {lowStock && (
                    <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      quedan {product.stock_qty}
                    </span>
                  )}
                  {outOfStock && (
                    <span className="absolute right-2 top-2 rounded-full bg-peligro px-2 py-0.5 text-[10px] font-bold text-white">
                      sin stock
                    </span>
                  )}
                  <span className="text-base font-bold leading-tight text-slate-800">
                    {product.name}
                  </span>
                  <span className="text-lg font-extrabold text-slate-700">
                    {formatMoney(product.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
