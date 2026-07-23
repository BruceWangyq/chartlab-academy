import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Shared, durable rate limiting. On serverless (Vercel) an in-memory Map is per-instance
// and resets on cold start, so limits are enforced in Postgres via an atomic upsert that
// resets the window when it has elapsed. Falls back to in-memory only when no database is
// configured (local demo) or the query fails, so a DB blip never blocks a request outright.
export async function checkRateLimit(request: Request, scope: string, limit: number, windowMs: number, subject = "") {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const client = forwarded || request.headers.get("x-real-ip") || "unknown";
  const key = `${scope}:${client}:${subject.toLowerCase()}`;
  const now = Date.now();
  const db = getDb();
  if (!db) return memoryLimit(key, limit, windowMs, now);
  try {
    const resetAt = new Date(now + windowMs);
    const rows = await db.execute(sql`
      insert into rate_limits (key, count, reset_at)
      values (${key}, 1, ${resetAt})
      on conflict (key) do update set
        count = case when rate_limits.reset_at <= now() then 1 else rate_limits.count + 1 end,
        reset_at = case when rate_limits.reset_at <= now() then ${resetAt} else rate_limits.reset_at end
      returning count, reset_at
    `);
    const row = (rows as unknown as Array<{ count: number | string; reset_at: string | Date }>)[0];
    if (!row) return { allowed: true, retryAfter: 0 };
    const count = Number(row.count);
    const resetMs = new Date(row.reset_at).getTime();
    if (count > limit) return { allowed: false, retryAfter: Math.max(1, Math.ceil((resetMs - now) / 1000)) };
    return { allowed: true, retryAfter: 0 };
  } catch {
    return memoryLimit(key, limit, windowMs, now);
  }
}

function memoryLimit(key: string, limit: number, windowMs: number, now: number) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); prune(now); return { allowed: true, retryAfter: 0 }; }
  if (current.count >= limit) return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  current.count += 1; return { allowed: true, retryAfter: 0 };
}

function prune(now: number) {
  if (buckets.size < 2000) return;
  for (const [key, value] of buckets) if (value.resetAt <= now) buckets.delete(key);
}
