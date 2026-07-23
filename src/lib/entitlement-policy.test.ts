import { describe, expect, it } from "vitest";
import { manualEntitlementGrantsPro, subscriptionGrantsPro } from "@/lib/entitlement-policy";

describe("Pro entitlement policy", () => {
  const now = new Date("2026-07-22T12:00:00Z");
  it("grants active and trialing subscriptions", () => { expect(subscriptionGrantsPro({ status: "active", graceEndsAt: null }, now)).toBe(true); expect(subscriptionGrantsPro({ status: "trialing", graceEndsAt: null }, now)).toBe(true); });
  it("grants past-due access only inside the grace window", () => { expect(subscriptionGrantsPro({ status: "past_due", graceEndsAt: new Date("2026-07-23") }, now)).toBe(true); expect(subscriptionGrantsPro({ status: "past_due", graceEndsAt: new Date("2026-07-21") }, now)).toBe(false); });
  it("does not grant cancelled or inactive subscriptions", () => { expect(subscriptionGrantsPro({ status: "canceled", graceEndsAt: null }, now)).toBe(false); expect(subscriptionGrantsPro({ status: "inactive", graceEndsAt: null }, now)).toBe(false); });
  it("supports permanent and unexpired manual corrections", () => { expect(manualEntitlementGrantsPro(null, now)).toBe(true); expect(manualEntitlementGrantsPro(new Date("2026-07-23"), now)).toBe(true); expect(manualEntitlementGrantsPro(new Date("2026-07-21"), now)).toBe(false); });
});
