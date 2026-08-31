import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const supabase = supabaseAdmin();

  const { data: current, error: fetchErr } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();
  if (fetchErr) return jsonError("Producto no encontrado", 404);

  const patch: Record<string, unknown> = {};
  if (typeof body?.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body?.category === "string" && body.category.trim()) patch.category = body.category.trim();
  if (["FRIO", "CALIENTE"].includes(body?.sectorEconomico)) patch.sector_economico = body.sectorEconomico;
  if (["FRIO", "CALIENTE"].includes(body?.sectorPreparacion)) patch.sector_preparacion = body.sectorPreparacion;
  if (typeof body?.price === "number" && body.price >= 0) patch.price = body.price;
  if (typeof body?.active === "boolean") patch.active = body.active;
  if (typeof body?.trackStock === "boolean") patch.track_stock = body.trackStock;
  if (typeof body?.lowStockThreshold === "number" && body.lowStockThreshold >= 0) {
    patch.low_stock_threshold = body.lowStockThreshold;
  }
  if (typeof body?.sortOrder === "number") patch.sort_order = body.sortOrder;

  // Ajuste de stock: se maneja como delta explícito para dejar auditoría clara
  // en stock_movements (sección 27: ver / modificar / agregar stock).
  let stockDelta = 0;
  if (typeof body?.stockDelta === "number" && Number.isFinite(body.stockDelta) && body.stockDelta !== 0) {
    stockDelta = Math.trunc(body.stockDelta);
  } else if (typeof body?.stockQty === "number" && Number.isFinite(body.stockQty)) {
    stockDelta = Math.trunc(body.stockQty) - current.stock_qty;
  }
  if (stockDelta !== 0) {
    patch.stock_qty = Math.max(0, current.stock_qty + stockDelta);
  }

  if (Object.keys(patch).length === 0) {
    return jsonError("No hay cambios para guardar");
  }

  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);

  if (stockDelta !== 0) {
    await supabase.from("stock_movements").insert({
      product_id: params.id,
      event_id: current.event_id,
      type: "AJUSTE",
      quantity_delta: data.stock_qty - current.stock_qty,
      note: typeof body?.stockNote === "string" ? body.stockNote.trim() || null : null,
    });
  }

  return NextResponse.json(data);
}
