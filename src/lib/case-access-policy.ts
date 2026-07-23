export const FREE_CASES_PER_MONTH = 5;

export type CaseAccessDecision =
  | { allowed: true; reason: "included" | "monthly-quota" | "demo-quota"; used?: number }
  | { allowed: false; reason: "login" | "upgrade"; used?: number };

export function decideCaseAccess(input: {
  signedIn: boolean;
  plan: "free" | "pro";
  databaseConfigured: boolean;
  usedThisMonth?: number;
  alreadyUsedThisCase?: boolean;
  includedInLocalDemo?: boolean;
}): CaseAccessDecision {
  if (!input.signedIn) return { allowed: false, reason: "login" };
  if (input.plan === "pro") return { allowed: true, reason: "included" };

  if (!input.databaseConfigured) {
    return input.includedInLocalDemo
      ? { allowed: true, reason: "demo-quota" }
      : { allowed: false, reason: "upgrade" };
  }

  const used = input.usedThisMonth ?? 0;
  if (input.alreadyUsedThisCase || used < FREE_CASES_PER_MONTH) {
    return { allowed: true, reason: "monthly-quota", used };
  }
  return { allowed: false, reason: "upgrade", used };
}
