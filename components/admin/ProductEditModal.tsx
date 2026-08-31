"use client";
import { useState } from "react";
import { apiPost, ApiError } from "@/lib/fetcher";
import type { ProductRow, Sector } from "@/lib/types";

async function patchProduct(id: string, body: unknown) {
  const res = await fetch(`/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.error ?? "Error", res.status);
  return json;
}

export function ProductEditModal({
  eventId,
  product,
  nextSortOrder,
  onClose,
  onSaved,
}: {
  eventId: string;
  product: ProductRow | null;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = product === null;
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [sectorEconomico, setSectorEconomico] = useState<Sector>(product?.sector_economico ?? "FRIO");
  const [sectorPreparacion, setSectorPreparacion] = useState<Sector>(
    product?.sector_preparacion ?? "FRIO"
  );
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [trackStock, setTrackStock] = useState(product?.track_stock ?? false);
  const [initialStock, setInitialStock] = useState(String(product?.stock_qty ?? 0));
  const [stockAdjust, setStockAdjust] = useState("");
  const [stockNote, setStockNote] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(String(product?.low_stock_threshold ?? 0));
  const [active, setActive] = useState(product?.active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const priceNum = Number(price);
    if (!name.trim() || !category.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      setError("Completá nombre, categoría y un precio válido");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isNew) {
        await apiPost("/api/products", {
          eventId,
          name: name.trim(),
          category: category.trim(),
          sectorEconomico,
          sectorPreparacion,
          price: priceNum,
          trackStock,
          stockQty: trackStock ? Number(initialStock) || 0 : 0,
          lowStockThreshold: Number(lowStockThreshold) || 0,
          sortOrder: nextSortOrder,
        });
      } else {
        const delta = Number(stockAdjust);
        await patchProduct(product.id, {
          name: name.trim(),
          category: category.trim(),
          sectorEconomico,
          sectorPreparacion,
          price: priceNum,
          trackStock,
          lowStockThreshold: Number(lowStockThreshold) || 0,
          active,
          ...(delta ? { stockDelta: delta, stockNote: stockNote.trim() || undefined } : {}),
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="mb-3 text-lg font-bold text-slate-800">
          {isNew ? "+ Nuevo producto" : `Editar: ${product.name}`}
        </h3>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-600">Nombre</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-slate-300 p-3"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-600">Categoría</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-300 p-3"
              placeholder="Ej: Jugos, Café y té…"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-600">Precio de venta</span>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-xl border border-slate-300 p-3"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-600">Sector económico</span>
              <select
                value={sectorEconomico}
                onChange={(e) => setSectorEconomico(e.target.value as Sector)}
                className="rounded-xl border border-slate-300 p-3"
              >
                <option value="FRIO">Frío</option>
                <option value="CALIENTE">Caliente</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-600">Sector preparación</span>
              <select
                value={sectorPreparacion}
                onChange={(e) => setSectorPreparacion(e.target.value as Sector)}
                className="rounded-xl border border-slate-300 p-3"
              >
                <option value="FRIO">Frío</option>
                <option value="CALIENTE">Caliente</option>
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={trackStock}
              onChange={(e) => setTrackStock(e.target.checked)}
              className="h-5 w-5"
            />
            <span className="text-sm font-semibold text-slate-600">Controla stock unitario</span>
          </label>

          {trackStock && isNew && (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-600">Stock inicial</span>
              <input
                type="number"
                min={0}
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                className="rounded-xl border border-slate-300 p-3"
              />
            </label>
          )}

          {trackStock && !isNew && (
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="mb-2 text-sm text-slate-600">
                Stock actual: <strong>{product.stock_qty}</strong>
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={stockAdjust}
                  onChange={(e) => setStockAdjust(e.target.value)}
                  placeholder="Ej: +20 o -3"
                  className="w-28 rounded-xl border border-slate-300 p-2"
                />
                <input
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  placeholder="Motivo del ajuste (opcional)"
                  className="flex-1 rounded-xl border border-slate-300 p-2"
                />
              </div>
            </div>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-600">Alerta de stock bajo (unidades)</span>
            <input
              type="number"
              min={0}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="rounded-xl border border-slate-300 p-3"
            />
          </label>

          {!isNew && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-5 w-5"
              />
              <span className="text-sm font-semibold text-slate-600">Producto activo (visible en Caja)</span>
            </label>
          )}
        </div>

        {error && <p className="mt-3 font-semibold text-peligro">{error}</p>}

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
            className="flex-1 rounded-xl bg-organizador py-3 font-bold text-white"
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
