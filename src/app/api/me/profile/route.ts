import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getDb } from "@/db";
import { auditLogs, profiles, subscriptions, users } from "@/db/schema";
import { clearSession, getSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/email";

const schema = z.object({ level: z.enum(["beginner", "intermediate", "advanced"]), goal: z.string().trim().max(120), weeklyMinutes: z.number().int().min(15).max(1200), marketingConsent: z.boolean(), learningReminders: z.boolean() });
export async function PATCH(request: Request) { const session = await getSession(); if (!session) return NextResponse.json({ error: "请先登录。" }, { status: 401 }); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "设置内容不正确。" }, { status: 400 }); const db = getDb(); if (!db) return NextResponse.json({ error: "本地演示尚未连接账户数据库。" }, { status: 503 }); await db.insert(profiles).values({ userId: session.id, ...parsed.data }).onConflictDoUpdate({ target: profiles.userId, set: parsed.data }); return NextResponse.json({ ok: true }); }
export async function DELETE(request: Request) {
  const session = await getSession(); if (!session) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  const rate = await checkRateLimit(request, "account-delete", 3, 24 * 60 * 60_000, session.id); if (!rate.allowed) return NextResponse.json({ error: "删除申请过于频繁，请稍后再试。" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const db = getDb(); if (!db) return NextResponse.json({ error: "本地演示尚未连接账户数据库。" }, { status: 503 });
  const activeSubscriptions = await db.select({ stripeSubscriptionId: subscriptions.stripeSubscriptionId }).from(subscriptions).where(andUserSubscription(session.id));
  const stripeIds = activeSubscriptions.flatMap((item) => item.stripeSubscriptionId ? [item.stripeSubscriptionId] : []);
  if (stripeIds.length && !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "暂时无法安全停止订阅续费，请稍后重试或联系支持。" }, { status: 503 });
  if (stripeIds.length) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    for (const subscriptionId of stripeIds) await stripe.subscriptions.cancel(subscriptionId, { invoice_now: false, prorate: false });
  }
  const requestedAt = new Date(); const scheduledFor = new Date(requestedAt); scheduledFor.setUTCDate(scheduledFor.getUTCDate() + 30);
  await db.transaction(async (transaction) => {
    await transaction.update(users).set({ deletionRequestedAt: requestedAt }).where(eq(users.id, session.id));
    await transaction.insert(auditLogs).values({ actorId: session.id, action: "account.deletion_requested", resource: `user:${session.id}`, metadata: { requestedAt: requestedAt.toISOString(), scheduledFor: scheduledFor.toISOString(), renewalStopped: stripeIds.length > 0 } });
  });
  await clearSession();
  void sendTransactionalEmail(session.email, "account_deletion_requested").catch(() => undefined);
  return NextResponse.json({ ok: true, scheduledFor: scheduledFor.toISOString(), renewalStopped: stripeIds.length > 0 });
}

function andUserSubscription(userId: string) {
  return and(eq(subscriptions.userId, userId), inArray(subscriptions.status, ["active", "trialing", "past_due"]));
}
