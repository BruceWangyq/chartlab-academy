import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "chartlab_session";
const authSecret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "local-development-secret-change-before-production");

// Defence-in-depth auth guard. Each protected route still calls getSession() itself; this
// only turns a missing/invalid session into an early /login redirect so a newly added page
// under these prefixes cannot leak before login. Scoped by `matcher` to protected prefixes
// only, so static/public pages are never touched (no impact on static generation or caching).
async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try { await jwtVerify(token, authSecret()); return true; } catch { return false; }
}

export async function proxy(request: NextRequest) {
  if (await hasValidSession(request)) return NextResponse.next();
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/notes/:path*",
    "/bookmarks/:path*",
    "/review/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
  ],
};
