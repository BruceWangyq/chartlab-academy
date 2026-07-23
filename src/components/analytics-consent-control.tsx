"use client";

import { useEffect, useState } from "react";
import { ANALYTICS_CONSENT_COOKIE, type AnalyticsConsentStatus } from "@/lib/consent";

export function AnalyticsConsentControl() {
  const [status, setStatus] = useState<AnalyticsConsentStatus>(null);
  useEffect(() => { const frame = requestAnimationFrame(() => setStatus(readConsent())); return () => cancelAnimationFrame(frame); }, []);
  function choose(value: Exclude<AnalyticsConsentStatus, null>) { const secure = location.protocol === "https:" ? "; Secure" : ""; document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`; setStatus(value); window.dispatchEvent(new CustomEvent("chartlab:analytics-consent", { detail: value })); }
  return <section className="consent-settings"><h2>匿名使用分析</h2><p>当前：{status === "accepted" ? "已允许" : status === "declined" ? "已拒绝" : "尚未选择"}。更改后立即生效，不影响课程、练习或订阅。</p><div><button className={status === "declined" ? "active" : ""} onClick={() => choose("declined")}>仅必要功能</button><button className={status === "accepted" ? "active" : ""} onClick={() => choose("accepted")}>允许匿名分析</button></div></section>;
}
function readConsent(): AnalyticsConsentStatus { const value = document.cookie.split("; ").find((item) => item.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`))?.split("=")[1]; return value === "accepted" || value === "declined" ? value : null; }
