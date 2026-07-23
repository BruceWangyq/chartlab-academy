import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signToken } from "@/lib/session";

export async function GET(request: Request) {
  if (!process.env.GOOGLE_CLIENT_ID) return NextResponse.json({ error: "Google 登录尚未配置。请先使用邮箱验证码。" }, { status: 503 });
  const requested = new URL(request.url).searchParams.get("next"); const next = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
  const state = crypto.randomUUID(); (await cookies()).set("chartlab_oauth_state", await signToken({ state, next }, "10m"), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth/google", maxAge: 600 });
  const origin = new URL(request.url).origin; const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID); url.searchParams.set("redirect_uri", `${origin}/api/auth/google/callback`); url.searchParams.set("response_type", "code"); url.searchParams.set("scope", "openid email profile"); url.searchParams.set("state", state); url.searchParams.set("prompt", "select_account");
  return NextResponse.redirect(url);
}
