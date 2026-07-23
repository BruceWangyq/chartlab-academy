import Stripe from "stripe";
import { and, asc, eq, gt, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, subscriptions } from "@/db/schema";
import { syncStripeSubscription } from "@/lib/subscription-mirror";
import { stripeSubscriptionMirror } from "@/lib/subscription-mirror-policy";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Subscription reconciliation is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb(); if (!db) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let corrected = 0; let failures = 0; let evaluated = 0; let cursor: string | undefined;
  while (true) {
    const records = await db.select({ id: subscriptions.id, userId: subscriptions.userId, stripeSubscriptionId: subscriptions.stripeSubscriptionId, planKey: subscriptions.planKey, status: subscriptions.status, periodEnd: subscriptions.periodEnd }).from(subscriptions).where(cursor ? and(isNotNull(subscriptions.stripeSubscriptionId), gt(subscriptions.id, cursor)) : isNotNull(subscriptions.stripeSubscriptionId)).orderBy(asc(subscriptions.id)).limit(100);
    if (!records.length) break;
    evaluated += records.length;
    for (let offset = 0; offset < records.length; offset += 5) {
      const batch = records.slice(offset, offset + 5);
      await Promise.all(batch.map(async (record) => {
      try {
        const remote = await stripe.subscriptions.retrieve(record.stripeSubscriptionId as string);
        const mirror = stripeSubscriptionMirror(remote);
        const changed = record.status !== mirror.status || record.planKey !== mirror.planKey || record.periodEnd?.getTime() !== mirror.periodEnd?.getTime();
        await syncStripeSubscription(db, remote, record.userId);
        if (changed) {
          corrected += 1;
          await db.insert(auditLogs).values({ actorId: null, action: "subscription.reconciled", resource: `subscription:${record.id}`, metadata: { previousStatus: record.status, currentStatus: mirror.status, stripeSubscriptionId: record.stripeSubscriptionId } });
        }
      } catch (error) {
        if (error instanceof Stripe.errors.StripeError && error.code === "resource_missing") {
          await db.update(subscriptions).set({ status: "canceled", graceEndsAt: null, updatedAt: new Date() }).where(eq(subscriptions.id, record.id));
          corrected += 1;
          await db.insert(auditLogs).values({ actorId: null, action: "subscription.reconciled_missing", resource: `subscription:${record.id}`, metadata: { previousStatus: record.status, currentStatus: "canceled", stripeSubscriptionId: record.stripeSubscriptionId } });
        } else failures += 1;
        }
      }));
    }
    cursor = records.at(-1)?.id;
    if (records.length < 100) break;
  }
  return NextResponse.json({ ok: failures === 0, evaluated, corrected, failures, timestamp: new Date().toISOString() }, { status: failures ? 207 : 200 });
}
