import { describe, expect, it } from "vitest";
import { decideCaseAccess, FREE_CASES_PER_MONTH } from "@/lib/case-access-policy";

describe("case access policy", () => {
  it("requires login even for cases included in the local demo", () => {
    expect(decideCaseAccess({ signedIn: false, plan: "free", databaseConfigured: false, includedInLocalDemo: true })).toEqual({ allowed: false, reason: "login" });
  });

  it("lets Pro members open every case", () => {
    expect(decideCaseAccess({ signedIn: true, plan: "pro", databaseConfigured: true, usedThisMonth: 99 })).toEqual({ allowed: true, reason: "included" });
  });

  it("allows five distinct cases per calendar month and blocks the sixth", () => {
    expect(decideCaseAccess({ signedIn: true, plan: "free", databaseConfigured: true, usedThisMonth: FREE_CASES_PER_MONTH - 1 })).toMatchObject({ allowed: true, reason: "monthly-quota" });
    expect(decideCaseAccess({ signedIn: true, plan: "free", databaseConfigured: true, usedThisMonth: FREE_CASES_PER_MONTH })).toEqual({ allowed: false, reason: "upgrade", used: FREE_CASES_PER_MONTH });
  });

  it("allows repeating one of the five cases without spending another slot", () => {
    expect(decideCaseAccess({ signedIn: true, plan: "free", databaseConfigured: true, usedThisMonth: FREE_CASES_PER_MONTH, alreadyUsedThisCase: true })).toEqual({ allowed: true, reason: "monthly-quota", used: FREE_CASES_PER_MONTH });
  });

  it("keeps the database-free development fallback limited to the five seeded demo cases", () => {
    expect(decideCaseAccess({ signedIn: true, plan: "free", databaseConfigured: false, includedInLocalDemo: true })).toEqual({ allowed: true, reason: "demo-quota" });
    expect(decideCaseAccess({ signedIn: true, plan: "free", databaseConfigured: false, includedInLocalDemo: false })).toEqual({ allowed: false, reason: "upgrade" });
  });
});
