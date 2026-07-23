import { sql } from "drizzle-orm";
import type { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
import { stripeSubscriptionMirror, type StripeSubscriptionLike } from "@/lib/subscription-mirror-policy";

export async function syncStripeSubscription(db: NonNullable<ReturnType<typeof getDb>>, subscription: StripeSubscriptionLike, fallbackUserId?: string) {
  const userId = subscription.metadata.user_id || fallbackUserId;
  if (!userId) return null;
  const mirror = stripeSubscriptionMirror(subscription);
  await db.insert(subscriptions).values({ userId, ...mirror }).onConflictDoUpdate({ target: subscriptions.stripeSubscriptionId, set: { stripeCustomerId: mirror.stripeCustomerId, planKey: mirror.planKey, status: mirror.status, periodEnd: mirror.periodEnd, graceEndsAt: mirror.status === "past_due" ? sql`coalesce(${subscriptions.graceEndsAt}, ${mirror.graceEndsAt})` : null, updatedAt: mirror.updatedAt } });
  return userId;
}
