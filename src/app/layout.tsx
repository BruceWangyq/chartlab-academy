import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AnalyticsPageView } from "@/components/analytics-page-view";
import { WebVitals } from "@/components/web-vitals";
import { ClientErrorMonitor } from "@/components/client-error-monitor";
import { CookieConsent } from "@/components/cookie-consent";
import { normalizeAnalyticsConsentMode } from "@/lib/consent";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "图表研习社｜从看懂图表开始",
    template: "%s｜图表研习社",
  },
  description: "面向中文学习者的技术分析课程与历史图表练习平台。系统学习市场结构、价格行为与风险管理。",
  applicationName: "ChartLab Academy",
  keywords: ["技术分析", "K线", "历史图表", "投资教育", "图表练习"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: "图表研习社｜从看懂图表开始",
    description: "结构化学习，历史图表练习，可解释复盘。",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1220",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const consentMode = normalizeAnalyticsConsentMode(process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_MODE);
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">跳到主要内容</a>
        <AnalyticsPageView consentMode={consentMode} />
        <WebVitals consentMode={consentMode} />
        {process.env.NEXT_PUBLIC_SENTRY_DSN && <ClientErrorMonitor dsn={process.env.NEXT_PUBLIC_SENTRY_DSN} tracesSampleRate={Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1)} />}
        {children}
        <CookieConsent mode={consentMode} />
      </body>
    </html>
  );
}
