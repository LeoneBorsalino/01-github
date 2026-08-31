import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // Anular está permitido para CAJA (sus propios pedidos del turno) y ADMIN.
  const auth = await requireSession(["CAJA"]);
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = await request.json().catch(() => null);
  const reason = body?.reason?.trim();
  if (!reason) return jsonError("Se requiere un motivo de anulación");

  const supabase = supabaseAdmin();
  const { data, error } = await supabase.rpc("void_order", {
    p_order_id: params.id,
    p_reason: reason,
    p_staff_id: session.staffId,
    p_staff_name: session.name,
  });

  if (error) return jsonError(error.message, 400);
  return NextResponse.json(data);
}
