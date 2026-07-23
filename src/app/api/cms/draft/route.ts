import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/secure-compare";
export async function GET(request: Request) { const url = new URL(request.url); const secret = url.searchParams.get("secret"); const requested = url.searchParams.get("path") ?? "/"; if (!process.env.SANITY_PREVIEW_SECRET || !safeEqual(secret, process.env.SANITY_PREVIEW_SECRET)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const path = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/"; (await draftMode()).enable(); return NextResponse.redirect(new URL(path, url.origin)); }
