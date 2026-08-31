import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireSession(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const date = body?.date;
  const location = body?.location?.trim();
  const description = body?.description?.trim() || null;
  const copyFromEventId = body?.copyFromEventId || null;

  if (!name || !date || !location) {
    return jsonError("Faltan datos: nombre, fecha y lugar son obligatorios");
  }

  const supabase = supabaseAdmin();
  const { data: event, error } = await supabase
    .from("events")
    .insert({ name, date, location, description, status: "BORRADOR" })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);

  if (copyFromEventId) {
    const { data: sourceProducts, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .eq("event_id", copyFromEventId);

    if (prodErr) return jsonError(prodErr.message, 500);

    if (sourceProducts && sourceProducts.length > 0) {
      const copies = sourceProducts.map((p) => ({
        event_id: event.id,
        name: p.name,
        category: p.category,
        sector_economico: p.sector_economico,
        sector_preparacion: p.sector_preparacion,
        price: p.price,
        track_stock: p.track_stock,
        stock_qty: 0, // stock nuevo por evento: el admin lo carga antes de iniciar
        low_stock_threshold: p.low_stock_threshold,
        active: p.active,
        sort_order: p.sort_order,
      }));
      const { error: insertErr } = await supabase.from("products").insert(copies);
      if (insertErr) return jsonError(insertErr.message, 500);
    }
  }

  return NextResponse.json(event, { status: 201 });
}
