type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(request: Request, scope: string, limit: number, windowMs: number, subject = "") {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const client = forwarded || request.headers.get("x-real-ip") || "unknown";
  const key = `${scope}:${client}:${subject.toLowerCase()}`; const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); prune(now); return { allowed: true, retryAfter: 0 }; }
  if (current.count >= limit) return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  current.count += 1; return { allowed: true, retryAfter: 0 };
}

function prune(now: number) {
  if (buckets.size < 2000) return;
  for (const [key, value] of buckets) if (value.resetAt <= now) buckets.delete(key);
}
