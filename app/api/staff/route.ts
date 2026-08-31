import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireSession, jsonError } from "@/lib/api-helpers";
import type { StaffRole } from "@/lib/types";

const VALID_ROLES: StaffRole[] = ["CAJA", "FRIO", "CALIENTE", "ADMIN"];

export async function GET() {
  const auth = await requireSession(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("staff")
    .select("id, name, role, active, created_at")
    .order("role", { ascending: true })
    .order("name", { ascending: true });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireSession(["ADMIN"]);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const role = body?.role as StaffRole;
  const pin = body?.pin as string;

  if (!name || !VALID_ROLES.includes(role) || !/^\d{4}$/.test(pin ?? "")) {
    return jsonError("Datos inválidos: nombre, sector y PIN de 4 dígitos son obligatorios");
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("staff")
    .insert({ name, role, pin_hash: pinHash, active: true })
    .select("id, name, role, active, created_at")
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data, { status: 201 });
}
