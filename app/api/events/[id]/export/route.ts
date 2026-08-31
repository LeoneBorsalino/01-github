import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";
import { computeClosing } from "@/lib/closing";
import { buildClosingCsv, buildClosingWorkbook } from "@/lib/exportClosing";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

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
  const { data: items, error: itemsErr } =
    orderIds.length > 0
      ? await supabase
          .from("order_items")
          .select("order_id, product_name, category, sector_economico, quantity, subtotal")
          .in("order_id", orderIds)
      : { data: [], error: null };
  if (itemsErr) return jsonError(itemsErr.message, 500);

  const closing = computeClosing(orders ?? [], items ?? []);
  const slug = event.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  if (format === "xlsx") {
    const buffer = await buildClosingWorkbook(event, closing);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="cierre-${slug}.xlsx"`,
      },
    });
  }

  const csv = buildClosingCsv(event, closing);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cierre-${slug}.csv"`,
    },
  });
}
