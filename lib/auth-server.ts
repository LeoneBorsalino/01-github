import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import type { SessionPayload, StaffRole } from "./types";

/** Lee y valida la sesión del staff logueado, para usar en Route Handlers. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Exige una sesión válida con alguno de los roles permitidos.
 * Devuelve la sesión o null (el caller responde 401/403).
 */
export async function requireRole(...roles: StaffRole[]): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  if (roles.length > 0 && !roles.includes(session.role) && session.role !== "ADMIN") {
    return null;
  }
  return session;
}
