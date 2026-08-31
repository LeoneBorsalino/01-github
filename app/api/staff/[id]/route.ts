import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";
import type { StaffRole } from "@/lib/types";

const VALID_ROLES: StaffRole[] = ["CAJA", "FRIO", "CALIENTE", "ADMIN"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const patch: Record<string, unknown> = {};

  if (typeof body?.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (VALID_ROLES.includes(body?.role)) patch.role = body.role;
  if (typeof body?.active === "boolean") patch.active = body.active;
  if (typeof body?.pin === "string") {
    if (!/^\d{4}$/.test(body.pin)) return jsonError("El PIN debe tener 4 dígitos");
    patch.pin_hash = await bcrypt.hash(body.pin, 10);
  }

  if (Object.keys(patch).length === 0) return jsonError("No hay cambios para guardar");

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("staff")
    .update(patch)
    .eq("id", params.id)
    .select("id, name, role, active, created_at")
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}
