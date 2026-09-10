import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";
import type { PaymentMethod } from "@/lib/types";

const VALID_PAYMENT_METHODS: PaymentMethod[] = ["EFECTIVO", "TRANSFERENCIA", "DEBITO", "CORTESIA"];

export async function POST(request: Request) {
  const auth = await requireSession(["CAJA"]);
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = await request.json().catch(() => null);
  const eventId = body?.eventId;
  const paymentMethod = body?.paymentMethod as PaymentMethod;
  const items = body?.items as { productId: string; quantity: number }[] | undefined;
  // Único descuento que el cliente puede pedir: 20% (feriante). CORTESIA
  // (100%) se decide en el servidor a partir del medio de pago, nunca de
  // este número — ver charge_order en supabase/schema.sql.
  const discountPercent = body?.feriante === true ? 20 : 0;

  if (!eventId) return jsonError("Falta el evento");
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return jsonError("Elegí un medio de pago válido");
  }
  if (!items || items.length === 0) {
    return jsonError("El pedido está vacío");
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase.rpc("charge_order", {
    p_event_id: eventId,
    p_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    p_payment_method: paymentMethod,
    p_staff_id: session.staffId,
    p_staff_name: session.name,
    p_discount_percent: discountPercent,
  });

  if (error) return jsonError(error.message, 400);
  return NextResponse.json(data, { status: 201 });
}
