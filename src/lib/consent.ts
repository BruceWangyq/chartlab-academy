export type AnalyticsConsentMode = "required" | "not_required" | "disabled";
export type AnalyticsConsentStatus = "accepted" | "declined" | null;

export const ANALYTICS_CONSENT_COOKIE = "chartlab_analytics_consent";

export function normalizeAnalyticsConsentMode(value: string | undefined): AnalyticsConsentMode {
  return value === "not_required" || value === "disabled" ? value : "required";
}

export function maySendAnalytics(mode: AnalyticsConsentMode, status: AnalyticsConsentStatus) {
  if (mode === "disabled") return false;
  if (mode === "not_required") return status !== "declined";
  return status === "accepted";
}
