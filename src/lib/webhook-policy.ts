export const WEBHOOK_PROCESSING_TIMEOUT_MS = 5 * 60_000;

export function webhookDeliveryDecision(status: string, updatedAt: Date, now = new Date()) {
  if (status === "processed") return "duplicate" as const;
  if (status === "failed") return "retry" as const;
  if (status === "processing" && now.getTime() - updatedAt.getTime() >= WEBHOOK_PROCESSING_TIMEOUT_MS) return "retry" as const;
  return "in_progress" as const;
}
