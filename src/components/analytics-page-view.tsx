"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ANALYTICS_CONSENT_COOKIE, maySendAnalytics, type AnalyticsConsentMode, type AnalyticsConsentStatus } from "@/lib/consent";

export function AnalyticsPageView({ consentMode }: { consentMode: AnalyticsConsentMode }) {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/") return;
    let sent = false;
    const send = () => {
      if (sent || !maySendAnalytics(consentMode, readConsent())) return;
      sent = true; const anonymousId = getId("chartlab:anonymous", localStorage); const sessionId = getId("chartlab:session", sessionStorage);
      const payload = JSON.stringify({ event: "landing_view", anonymousId, sessionId, locale: navigator.language, device: window.matchMedia("(max-width: 720px)").matches ? "mobile" : "desktop" });
      if (!navigator.sendBeacon?.("/api/events", new Blob([payload], { type: "application/json" }))) void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
    };
    send(); window.addEventListener("chartlab:analytics-consent", send); return () => window.removeEventListener("chartlab:analytics-consent", send);
  }, [consentMode, pathname]);
  return null;
}
function getId(key: string, storage: Storage) { const current = storage.getItem(key); if (current) return current; const value = crypto.randomUUID(); storage.setItem(key, value); return value; }
function readConsent(): AnalyticsConsentStatus { const value = document.cookie.split("; ").find((item) => item.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`))?.split("=")[1]; return value === "accepted" || value === "declined" ? value : null; }
