import { afterEach, describe, expect, it } from "vitest";
import { mapStripeStatus, stripeSubscriptionMirror } from "@/lib/subscription-mirror-policy";

const base = { id: "sub_1", customer: "cus_1", metadata: { user_id: "user-1", plan_key: "annual" }, items: { data: [{ current_period_end: 1_800_000_000 }] } };

describe("subscription mirror policy", () => {
  afterEach(() => { delete process.env.SUBSCRIPTION_GRACE_DAYS; });
  it("maps Stripe states without accidentally granting unknown states", () => {
    expect(mapStripeStatus("active")).toBe("active");
    expect(mapStripeStatus("trialing")).toBe("trialing");
    expect(mapStripeStatus("past_due")).toBe("past_due");
    expect(mapStripeStatus("canceled")).toBe("canceled");
    expect(mapStripeStatus("paused")).toBe("inactive");
  });
  it("derives billing period and a configured grace deadline", () => {
    process.env.SUBSCRIPTION_GRACE_DAYS = "3";
    const now = new Date("2026-07-22T00:00:00Z");
    const mirror = stripeSubscriptionMirror({ ...base, status: "past_due" }, now);
    expect(mirror.planKey).toBe("annual");
    expect(mirror.periodEnd?.getTime()).toBe(1_800_000_000_000);
    expect(mirror.graceEndsAt?.toISOString()).toBe("2026-07-25T00:00:00.000Z");
  });
});
