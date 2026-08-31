import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, SESSION_COOKIE, roleCanAccess, verifySessionToken } from "./lib/session";

const PUBLIC_PATHS = ["/", "/api/auth/login", "/api/auth/me", "/manifest.json"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/icons/")) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname === "/sw.js" || pathname.startsWith("/workbox-")) return true;
  return false;
}

const PROTECTED_PREFIXES = ["/caja", "/frio", "/caliente", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!roleCanAccess(session.role, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[session.role];
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
