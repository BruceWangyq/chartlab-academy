import { NextResponse } from "next/server";
import { checkDb } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeEqual } from "@/lib/secure-compare";
export async function GET(request: Request) {
  const secret = process.env.HEALTHCHECK_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) return NextResponse.json({ error: "Health check is not configured" }, { status: 503 });
  if (secret && !safeEqual(request.headers.get("authorization"), `Bearer ${secret}`)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rate = await checkRateLimit(request, "health", 30, 60_000); if (!rate.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  try { const database = await checkDb(); return NextResponse.json({ status: "ok", service: "chartlab-academy", database, timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ status: "degraded", database: { configured: true, ok: false }, timestamp: new Date().toISOString() }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
