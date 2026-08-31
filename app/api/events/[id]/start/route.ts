import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const supabase = supabaseAdmin();

  const { data: event, error: fetchErr } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();
  if (fetchErr) return jsonError("Evento no encontrado", 404);
  if (event.status !== "BORRADOR") {
    return jsonError("Solo se puede iniciar un evento en estado BORRADOR", 409);
  }

  const { data: activeEvents, error: activeErr } = await supabase
    .from("events")
    .select("id, name")
    .eq("status", "ACTIVO");
  if (activeErr) return jsonError(activeErr.message, 500);
  if (activeEvents && activeEvents.length > 0) {
    return jsonError(
      `Ya hay un evento activo ("${activeEvents[0].name}"). Cerralo antes de iniciar uno nuevo.`,
      409
    );
  }

  const { data, error } = await supabase
    .from("events")
    .update({ status: "ACTIVO", started_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}
