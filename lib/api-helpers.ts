import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "./auth-server";
import type { SessionPayload, StaffRole } from "./types";

/**
 * Exige sesión válida. Si `roles` se especifica, exige además que el rol sea
 * uno de esos (ADMIN siempre pasa). Devuelve la sesión o ya escribe la
 * respuesta 401/403 (el caller debe `return` el error si `session` es null).
 */
export async function requireSession(
  roles?: StaffRole[]
): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if (roles && roles.length > 0 && session.role !== "ADMIN" && !roles.includes(session.role)) {
    return { error: NextResponse.json({ error: "No autorizado para esta acción" }, { status: 403 }) };
  }
  return { session };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
