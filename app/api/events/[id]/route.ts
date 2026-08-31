import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("events").select("*").eq("id", params.id).single();
  if (error) return jsonError("Evento no encontrado", 404);
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const supabase = supabaseAdmin();

  const { data: existing, error: fetchErr } = await supabase
    .from("events")
    .select("status")
    .eq("id", params.id)
    .single();
  if (fetchErr) return jsonError("Evento no encontrado", 404);
  if (existing.status === "CERRADO") {
    return jsonError("El evento está cerrado: no se puede editar", 409);
  }

  const patch: Record<string, unknown> = {};
  if (typeof body?.name === "string") patch.name = body.name.trim();
  if (typeof body?.date === "string") patch.date = body.date;
  if (typeof body?.location === "string") patch.location = body.location.trim();
  if (typeof body?.description === "string" || body?.description === null) {
    patch.description = body.description?.trim() || null;
  }

  const { data, error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}
