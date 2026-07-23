"use client";

import { useEffect } from "react";

export function ClientErrorMonitor({ dsn, tracesSampleRate }: { dsn: string; tracesSampleRate: number }) {
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      const Sentry = await import("@sentry/nextjs");
      if (!active) return;
      Sentry.init({ dsn, sendDefaultPii: false, tracesSampleRate, environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV });
    }, 1000);
    return () => { active = false; window.clearTimeout(timer); };
  }, [dsn, tracesSampleRate]);
  return null;
}
