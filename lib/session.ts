import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload, StaffRole } from "./types";

export const SESSION_COOKIE = "barra_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12hs: alcanza y sobra para un turno de evento

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET no está configurado (o es muy corto). Definilo en las variables de entorno."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.staffId === "string" &&
      typeof payload.name === "string" &&
      typeof payload.role === "string"
    ) {
      return { staffId: payload.staffId, name: payload.name, role: payload.role as StaffRole };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;

/** Prefijos de ruta permitidos por rol — usado por middleware.ts */
export const ROLE_HOME: Record<StaffRole, string> = {
  CAJA: "/caja",
  FRIO: "/frio",
  CALIENTE: "/caliente",
  ADMIN: "/admin",
};

export function roleCanAccess(role: StaffRole, pathname: string): boolean {
  if (role === "ADMIN") return true; // el admin ve todo
  if (pathname.startsWith("/caja")) return role === "CAJA";
  if (pathname.startsWith("/frio")) return role === "FRIO";
  if (pathname.startsWith("/caliente")) return role === "CALIENTE";
  if (pathname.startsWith("/admin")) return false;
  return true;
}
