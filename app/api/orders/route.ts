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
    .from("orders")
    .select("*, order_items(*)")
    .eq("event_id", eventId)
    .order("order_number", { ascending: false });

  if (error) return jsonError(error.message, 500);

  const orders = (data ?? []).map(({ order_items, ...order }) => ({
    ...order,
    items: order_items ?? [],
  }));

  return NextResponse.json(orders);
}
