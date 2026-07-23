"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { void import("@sentry/nextjs").then((Sentry) => { if (process.env.NEXT_PUBLIC_SENTRY_DSN) Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, sendDefaultPii: false }); Sentry.captureException(error); }); }, [error]);
  return <html lang="zh-CN"><body><main className="global-error"><span>ChartLab Academy</span><h1>页面暂时没有完成加载</h1><p>你的本地草稿不会因此丢失。可以重试；如果问题持续，请稍后返回。</p><button className="button button-primary" onClick={reset}>重新加载</button></main></body></html>;
}
