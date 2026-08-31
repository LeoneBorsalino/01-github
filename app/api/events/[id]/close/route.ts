import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const supabase = supabaseAdmin();

  const { data: event, error: fetchErr } = await supabase
    .from("events")
    .select("status")
    .eq("id", params.id)
    .single();
  if (fetchErr) return jsonError("Evento no encontrado", 404);
  if (event.status !== "ACTIVO") {
    return jsonError("Solo se puede cerrar un evento que esté ACTIVO", 409);
  }

  const { data, error } = await supabase
    .from("events")
    .update({ status: "CERRADO", closed_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}
