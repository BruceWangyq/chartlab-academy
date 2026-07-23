export function subscriptionGrantsPro(input: { status: string; graceEndsAt: Date | null }, now = new Date()) {
  return input.status === "active" || input.status === "trialing" || (input.status === "past_due" && Boolean(input.graceEndsAt && input.graceEndsAt > now));
}

export function manualEntitlementGrantsPro(expiresAt: Date | null, now = new Date()) {
  return expiresAt === null || expiresAt > now;
}
