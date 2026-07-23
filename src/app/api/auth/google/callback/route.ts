import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionForEmail, verifyToken } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url); const code = url.searchParams.get("code"); const state = url.searchParams.get("state"); const token = (await cookies()).get("chartlab_oauth_state")?.value; const stored = token ? await verifyToken<{ state: string; next?: string }>(token) : null;
  if (!code || !state || stored?.state !== state || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
  (await cookies()).set("chartlab_oauth_state", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth/google", maxAge: 0 });
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: `${url.origin}/api/auth/google/callback`, grant_type: "authorization_code" }) });
  if (!tokenResponse.ok) return NextResponse.redirect(new URL("/login?error=oauth", url.origin)); const tokens = await tokenResponse.json();
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${tokens.access_token}` } }); const profile = await profileResponse.json();
  if (!profile.email) return NextResponse.redirect(new URL("/login?error=oauth", url.origin)); const user = await createSessionForEmail(profile.email, "google");
  const next = stored.next?.startsWith("/") && !stored.next.startsWith("//") ? stored.next : "/dashboard";
  return NextResponse.redirect(new URL(user.onboarded ? next : `/onboarding?next=${encodeURIComponent(next)}`, url.origin));
}
