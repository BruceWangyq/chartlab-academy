"use client";

import { useEffect, useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { ANALYTICS_CONSENT_COOKIE, maySendAnalytics, type AnalyticsConsentMode, type AnalyticsConsentStatus } from "@/lib/consent";

const tracked = new Set(["LCP", "INP", "CLS"]);

export function WebVitals({ consentMode }: { consentMode: AnalyticsConsentMode }) {
  const pending = useRef(new Map<string, Parameters<typeof submitMetric>[0]>());
  useReportWebVitals((metric) => {
    if (!tracked.has(metric.name)) return;
    const data = { name: metric.name, value: metric.value, rating: metric.rating, navigationType: metric.navigationType, path: window.location.pathname };
    if (maySendAnalytics(consentMode, readConsent())) submitMetric(data); else pending.current.set(metric.name, data);
  });
  useEffect(() => { const flush = () => { if (!maySendAnalytics(consentMode, readConsent())) return; for (const metric of pending.current.values()) submitMetric(metric); pending.current.clear(); }; flush(); window.addEventListener("chartlab:analytics-consent", flush); return () => window.removeEventListener("chartlab:analytics-consent", flush); }, [consentMode]);
  return null;
}

function submitMetric(metric: { name: string; value: number; rating: string; navigationType: string; path: string }) {
  const body = JSON.stringify({ event: "web_vital_recorded", metric: metric.name, value: metric.value, rating: metric.rating, path: metric.path, navigationType: metric.navigationType });
  if (!navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
}
function readConsent(): AnalyticsConsentStatus { const value = document.cookie.split("; ").find((item) => item.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`))?.split("=")[1]; return value === "accepted" || value === "declined" ? value : null; }
