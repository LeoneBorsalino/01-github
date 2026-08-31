import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";
import type { Sector } from "@/lib/types";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(["FRIO", "CALIENTE"]);
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = await request.json().catch(() => null);
  const sector = body?.sector as Sector;
  const status = body?.status as "PENDIENTE" | "EN_PREPARACION" | "LISTO";

  if (!["FRIO", "CALIENTE"].includes(sector)) return jsonError("Sector inválido");
  if (!["PENDIENTE", "EN_PREPARACION", "LISTO"].includes(status)) return jsonError("Estado inválido");

  // Un usuario de FRIO no puede tocar el estado de CALIENTE, y viceversa (el ADMIN sí).
  if (session.role !== "ADMIN" && session.role !== sector) {
    return jsonError("No autorizado para actualizar este sector", 403);
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase.rpc("update_order_prep_status", {
    p_order_id: params.id,
    p_sector: sector,
    p_status: status,
  });

  if (error) return jsonError(error.message, 400);
  return NextResponse.json(data);
}
