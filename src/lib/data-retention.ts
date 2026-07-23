export const ACCOUNT_DELETION_DELAY_DAYS = 30;
export const BILLING_RETENTION_YEARS = 7;
export const SECURITY_AUDIT_RETENTION_DAYS = 365;

export function dataRetentionCutoffs(now = new Date()) {
  const deletion = new Date(now); deletion.setUTCDate(deletion.getUTCDate() - ACCOUNT_DELETION_DELAY_DAYS);
  const billing = new Date(now); billing.setUTCFullYear(billing.getUTCFullYear() - BILLING_RETENTION_YEARS);
  const securityAudit = new Date(now); securityAudit.setUTCDate(securityAudit.getUTCDate() - SECURITY_AUDIT_RETENTION_DAYS);
  return { deletion, billing, securityAudit };
}

export function redactedAccountEmail(userId: string) {
  return `deleted+${userId}@redacted.invalid`;
}
