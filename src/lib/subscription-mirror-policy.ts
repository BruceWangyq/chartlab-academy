export type LocalSubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled";
export type StripeSubscriptionLike = {
  id: string;
  status: string;
  customer: string | { id: string };
  metadata: Record<string, string>;
  items: { data: Array<{ current_period_end?: number }> };
};

export function stripeSubscriptionMirror(subscription: StripeSubscriptionLike, now = new Date()) {
  const status = mapStripeStatus(subscription.status);
  const period = subscription.items.data[0]?.current_period_end;
  const graceDays = Number(process.env.SUBSCRIPTION_GRACE_DAYS ?? 5);
  return {
    stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    planKey: subscription.metadata.plan_key ?? "pro",
    status,
    periodEnd: period ? new Date(period * 1000) : null,
    graceEndsAt: status === "past_due" ? new Date(now.getTime() + graceDays * 86_400_000) : null,
    updatedAt: now,
  };
}

export function mapStripeStatus(status: string): LocalSubscriptionStatus {
  if (status === "trialing" || status === "active" || status === "past_due" || status === "canceled") return status;
  return "inactive";
}
