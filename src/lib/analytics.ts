import "server-only";
import { cookies } from "next/headers";
import { ANALYTICS_CONSENT_COOKIE, maySendAnalytics, normalizeAnalyticsConsentMode, type AnalyticsConsentStatus } from "@/lib/consent";

export type ProductEvent = "landing_view" | "sign_up_completed" | "first_learning_action" | "lesson_completed" | "quiz_submitted" | "chart_case_submitted" | "checkout_started" | "subscription_activated" | "subscription_cancelled" | "meaningful_learning_action" | "web_vital_recorded";
export async function captureProductEvent(event: ProductEvent, distinctId: string, properties: Record<string, string | number | boolean | null | string[]> = {}) {
  const mode = normalizeAnalyticsConsentMode(process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_MODE);
  const rawConsent = (await cookies()).get(ANALYTICS_CONSENT_COOKIE)?.value;
  const consent: AnalyticsConsentStatus = rawConsent === "accepted" || rawConsent === "declined" ? rawConsent : null;
  if (!maySendAnalytics(mode, consent)) return { captured: false, reason: "consent_required" as const };
  if (!process.env.POSTHOG_API_KEY) return { captured: false, reason: "not_configured" as const };
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`${(process.env.POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "")}/capture/`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ api_key: process.env.POSTHOG_API_KEY, event, properties: { distinct_id: distinctId, user_id: distinctId, anonymous_id: null, session_id: null, timestamp: new Date().toISOString(), locale: "zh-CN", device: "server", ...properties } }), signal: controller.signal });
    return { captured: response.ok };
  } catch { return { captured: false, reason: "unavailable" as const }; } finally { clearTimeout(timer); }
}
