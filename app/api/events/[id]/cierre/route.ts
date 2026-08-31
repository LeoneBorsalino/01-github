import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";
import { computeClosing } from "@/lib/closing";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const supabase = supabaseAdmin();

  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();
  if (eventErr) return jsonError("Evento no encontrado", 404);

  const { data: orders, error: ordersErr } = await supabase
    .from("orders")
    .select("id, status, payment_method, total")
    .eq("event_id", params.id);
  if (ordersErr) return jsonError(ordersErr.message, 500);

  const orderIds = (orders ?? []).map((o) => o.id);
  let items: {
    order_id: string;
    product_name: string;
    category: string;
    sector_economico: "FRIO" | "CALIENTE";
    quantity: number;
    subtotal: number;
  }[] = [];

  if (orderIds.length > 0) {
    const { data: itemsData, error: itemsErr } = await supabase
      .from("order_items")
      .select("order_id, product_name, category, sector_economico, quantity, subtotal")
      .in("order_id", orderIds);
    if (itemsErr) return jsonError(itemsErr.message, 500);
    items = itemsData ?? [];
  }

  const closing = computeClosing(orders ?? [], items);

  return NextResponse.json({ event, closing });
}
