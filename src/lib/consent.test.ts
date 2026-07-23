import { describe, expect, it } from "vitest";
import { maySendAnalytics, normalizeAnalyticsConsentMode } from "@/lib/consent";

describe("regional analytics consent", () => {
  it("defaults to explicit consent", () => {
    expect(normalizeAnalyticsConsentMode(undefined)).toBe("required");
    expect(maySendAnalytics("required", null)).toBe(false);
    expect(maySendAnalytics("required", "accepted")).toBe(true);
  });

  it("supports regions where consent is not required and a global off switch", () => {
    expect(maySendAnalytics("not_required", null)).toBe(true);
    expect(maySendAnalytics("not_required", "declined")).toBe(false);
    expect(maySendAnalytics("disabled", "accepted")).toBe(false);
  });
});
