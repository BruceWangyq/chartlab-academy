import { describe, expect, it } from "vitest";
import { webhookDeliveryDecision } from "@/lib/webhook-policy";

describe("webhook delivery policy", () => {
  const now = new Date("2026-07-22T12:00:00Z");
  it("keeps processed deliveries idempotent", () => expect(webhookDeliveryDecision("processed", now, now)).toBe("duplicate"));
  it("allows failed deliveries to be replayed", () => expect(webhookDeliveryDecision("failed", now, now)).toBe("retry"));
  it("does not race an active worker but recovers a stale processing claim", () => {
    expect(webhookDeliveryDecision("processing", new Date("2026-07-22T11:58:00Z"), now)).toBe("in_progress");
    expect(webhookDeliveryDecision("processing", new Date("2026-07-22T11:54:00Z"), now)).toBe("retry");
  });
});
