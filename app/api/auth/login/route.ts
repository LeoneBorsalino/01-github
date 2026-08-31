import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import type { StaffRole } from "@/lib/types";

const VALID_ROLES: StaffRole[] = ["CAJA", "FRIO", "CALIENTE", "ADMIN"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const role = body?.role as StaffRole | undefined;
  const pin = body?.pin as string | undefined;

  if (!role || !VALID_ROLES.includes(role) || !pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "Sector o PIN inválido" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: candidates, error } = await supabase
    .from("staff")
    .select("id, name, pin_hash")
    .eq("role", role)
    .eq("active", true);

  if (error) {
    return NextResponse.json({ error: "No se pudo validar el PIN" }, { status: 500 });
  }

  for (const candidate of candidates ?? []) {
    if (await bcrypt.compare(pin, candidate.pin_hash)) {
      const token = await createSessionToken({ staffId: candidate.id, name: candidate.name, role });
      const res = NextResponse.json({ role, name: candidate.name });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      });
      return res;
    }
  }

  return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
}
