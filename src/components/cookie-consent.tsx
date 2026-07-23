"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ANALYTICS_CONSENT_COOKIE, type AnalyticsConsentMode, type AnalyticsConsentStatus } from "@/lib/consent";

export function CookieConsent({ mode }: { mode: AnalyticsConsentMode }) {
  const [status, setStatus] = useState<AnalyticsConsentStatus>(null);
  useEffect(() => { const frame = requestAnimationFrame(() => setStatus(readConsent())); return () => cancelAnimationFrame(frame); }, []);
  if (mode !== "required" || status) return null;
  function choose(value: Exclude<AnalyticsConsentStatus, null>) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    setStatus(value); window.dispatchEvent(new CustomEvent("chartlab:analytics-consent", { detail: value }));
  }
  return <aside className="cookie-consent" role="dialog" aria-modal="false" aria-labelledby="cookie-consent-title"><div><h2 id="cookie-consent-title">是否允许匿名使用分析？</h2><p>我们用匿名访问与性能数据改进课程，不发送笔记、练习理由或支付信息。你可以拒绝，不影响任何功能。<Link href="/legal/privacy">查看隐私政策</Link></p></div><div><button className="button button-outline" onClick={() => choose("declined")}>仅必要功能</button><button className="button button-primary" onClick={() => choose("accepted")}>允许匿名分析</button></div></aside>;
}

function readConsent(): AnalyticsConsentStatus {
  const value = document.cookie.split("; ").find((item) => item.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`))?.split("=")[1];
  return value === "accepted" || value === "declined" ? value : null;
}
