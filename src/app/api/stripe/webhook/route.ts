import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users, webhookEvents } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { sendTransactionalEmail } from "@/lib/email";
import { captureProductEvent } from "@/lib/analytics";
import { checkRateLimit } from "@/lib/rate-limit";
import { webhookDeliveryDecision } from "@/lib/webhook-policy";
import { syncStripeSubscription } from "@/lib/subscription-mirror";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  const rate = checkRateLimit(request, "stripe-webhook", 180, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many webhook requests" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const signature = request.headers.get("stripe-signature"); if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  const body = await request.text(); const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET); } catch { return NextResponse.json({ error: "Invalid signature" }, { status: 400 }); }
  const db = getDb(); if (!db) return NextResponse.json({ error: "Subscription database is not configured" }, { status: 503 });
  const payloadHash = Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body))).toString("hex");
  const now = new Date();
  const inserted = await db.insert(webhookEvents).values({ provider: "stripe", eventId: event.id, status: "processing", payloadHash, updatedAt: now }).onConflictDoNothing().returning({ id: webhookEvents.id });
  if (inserted.length === 0) {
    const [existing] = await db.select({ status: webhookEvents.status, updatedAt: webhookEvents.updatedAt }).from(webhookEvents).where(and(eq(webhookEvents.provider, "stripe"), eq(webhookEvents.eventId, event.id))).limit(1);
    if (!existing) return NextResponse.json({ error: "Webhook claim was lost" }, { status: 409 });
    const decision = webhookDeliveryDecision(existing.status, existing.updatedAt, now);
    if (decision !== "retry") return NextResponse.json({ received: true, duplicate: decision === "duplicate", inProgress: decision === "in_progress" }, { status: decision === "in_progress" ? 202 : 200 });
    const claimed = await db.update(webhookEvents).set({ status: "processing", attempts: sql`${webhookEvents.attempts} + 1`, payloadHash, updatedAt: now }).where(and(eq(webhookEvents.provider, "stripe"), eq(webhookEvents.eventId, event.id), eq(webhookEvents.status, existing.status), eq(webhookEvents.updatedAt, existing.updatedAt))).returning({ id: webhookEvents.id });
    if (!claimed.length) return NextResponse.json({ received: true, inProgress: true }, { status: 202 });
  }
  try {
    if (event.type.startsWith("customer.subscription.")) {
      const subscription = event.data.object as Stripe.Subscription; const userId = await syncStripeSubscription(db, subscription);
      if (userId && event.type === "customer.subscription.created") { await notifyUser(db, userId, "subscription_active"); await captureProductEvent("subscription_activated", userId, { plan_key: subscription.metadata.plan_key ?? "pro", status: subscription.status, timestamp: new Date().toISOString() }); }
      if (userId && event.type === "customer.subscription.deleted") { await notifyUser(db, userId, "subscription_cancelled"); await captureProductEvent("subscription_cancelled", userId, { plan_key: subscription.metadata.plan_key ?? "pro", status: subscription.status, timestamp: new Date().toISOString() }); }
    }
    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice; const ref = invoice.parent?.subscription_details?.subscription; const subscriptionId = typeof ref === "string" ? ref : ref?.id;
      if (subscriptionId) { const userId = await syncStripeSubscription(db, await stripe.subscriptions.retrieve(subscriptionId)); if (userId && event.type === "invoice.payment_failed") await notifyUser(db, userId, "payment_failed"); }
    }
    await db.update(webhookEvents).set({ status: "processed", processedAt: new Date(), updatedAt: new Date() }).where(and(eq(webhookEvents.provider, "stripe"), eq(webhookEvents.eventId, event.id)));
    return NextResponse.json({ received: true });
  } catch { await db.update(webhookEvents).set({ status: "failed", updatedAt: new Date() }).where(and(eq(webhookEvents.provider, "stripe"), eq(webhookEvents.eventId, event.id))); return NextResponse.json({ error: "Processing failed" }, { status: 500 }); }
}
async function notifyUser(db: NonNullable<ReturnType<typeof getDb>>, userId: string, kind: "subscription_active" | "subscription_cancelled" | "payment_failed") { const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1); if (user) await sendTransactionalEmail(user.email, kind).catch(() => undefined); }
