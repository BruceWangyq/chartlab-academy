import { NextResponse } from "next/server";
import { z } from "zod";
import { captureProductEvent } from "@/lib/analytics";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
const landingSchema = z.object({ event: z.literal("landing_view"), anonymousId: z.uuid(), sessionId: z.uuid(), locale: z.string().min(2).max(20), device: z.enum(["desktop", "mobile"]) });
const vitalSchema = z.object({ event: z.literal("web_vital_recorded"), metric: z.enum(["LCP", "INP", "CLS"]), value: z.number().nonnegative().finite(), rating: z.enum(["good", "needs-improvement", "poor"]), path: z.string().startsWith("/").max(300), navigationType: z.string().max(40) });
const schema = z.discriminatedUnion("event", [landingSchema, vitalSchema]);
export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "analytics", 60, 60_000);
  if (!rate.allowed) return new NextResponse(null, { status: 204 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const user = await getSession();
  const data = parsed.data;
  const distinctId = user?.id ?? (data.event === "landing_view" ? data.anonymousId : `anonymous-vitals:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"}`);
  const result = data.event === "landing_view"
    ? await captureProductEvent(data.event, distinctId, { anonymous_id: data.anonymousId, session_id: data.sessionId, locale: data.locale, device: data.device, timestamp: new Date().toISOString() })
    : await captureProductEvent(data.event, distinctId, { metric: data.metric, value: data.value, rating: data.rating, path: data.path, navigation_type: data.navigationType, timestamp: new Date().toISOString() });
  return NextResponse.json({ accepted: true, captured: result.captured }, { status: 202 });
}
