import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { safeEqual } from "@/lib/secure-compare";
const schema = z.object({ paths: z.array(z.string().startsWith("/")).max(20).default([]), tags: z.array(z.string().min(1).max(80)).max(20).default([]) });
export async function POST(request: Request) { const secret = request.headers.get("x-chartlab-revalidate-secret"); if (!process.env.CMS_REVALIDATE_SECRET || !safeEqual(secret, process.env.CMS_REVALIDATE_SECRET)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 }); parsed.data.paths.forEach((path) => revalidatePath(path)); parsed.data.tags.forEach((tag) => revalidateTag(tag, "max")); return NextResponse.json({ revalidated: true, ...parsed.data }); }
