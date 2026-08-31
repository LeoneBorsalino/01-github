import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) return jsonError("Falta eventId");

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireSession(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const eventId = body?.eventId;
  const name = body?.name?.trim();
  const category = body?.category?.trim();
  const sectorEconomico = body?.sectorEconomico;
  const sectorPreparacion = body?.sectorPreparacion;
  const price = Number(body?.price);
  const trackStock = Boolean(body?.trackStock);
  const stockQty = Number(body?.stockQty ?? 0);
  const lowStockThreshold = Number(body?.lowStockThreshold ?? 0);
  const sortOrder = Number(body?.sortOrder ?? 0);

  if (
    !eventId ||
    !name ||
    !category ||
    !["FRIO", "CALIENTE"].includes(sectorEconomico) ||
    !["FRIO", "CALIENTE"].includes(sectorPreparacion) ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return jsonError("Datos de producto inválidos");
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .insert({
      event_id: eventId,
      name,
      category,
      sector_economico: sectorEconomico,
      sector_preparacion: sectorPreparacion,
      price,
      track_stock: trackStock,
      stock_qty: trackStock ? stockQty : 0,
      low_stock_threshold: lowStockThreshold,
      active: true,
      sort_order: sortOrder,
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);

  if (trackStock && stockQty > 0) {
    await supabase.from("stock_movements").insert({
      product_id: data.id,
      event_id: eventId,
      type: "CARGA_INICIAL",
      quantity_delta: stockQty,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
