import { describe, expect, it } from "vitest";
import { dataRetentionCutoffs, redactedAccountEmail } from "@/lib/data-retention";

describe("data retention", () => {
  it("calculates the deletion, billing and security retention boundaries in UTC", () => {
    const cutoffs = dataRetentionCutoffs(new Date("2026-07-22T12:00:00.000Z"));
    expect(cutoffs.deletion.toISOString()).toBe("2026-06-22T12:00:00.000Z");
    expect(cutoffs.billing.toISOString()).toBe("2019-07-22T12:00:00.000Z");
    expect(cutoffs.securityAudit.toISOString()).toBe("2025-07-22T12:00:00.000Z");
  });

  it("uses a unique non-deliverable address when anonymizing an account", () => {
    expect(redactedAccountEmail("abc-123")).toBe("deleted+abc-123@redacted.invalid");
  });
});
