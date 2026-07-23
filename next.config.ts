import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }] },
  experimental: { sri: { algorithm: "sha256" } },
  async headers() {
    const devEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
    // Next.js emits inline bootstrap scripts on statically prerendered pages, so script-src
    // keeps 'unsafe-inline'. A nonce/strict-dynamic policy is intentionally not used: the
    // per-request nonce cannot be injected into cached static HTML, so it would block those
    // scripts. Risk is contained by SRI (config below), no 'unsafe-eval' in production,
    // 'object-src none', and 'base-uri self'.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${devEval}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://cdn.sanity.io https://image.mux.com",
      "media-src 'self' blob: https://stream.mux.com",
      "connect-src 'self' https://api.stripe.com https://*.sanity.io https://stream.mux.com",
      "font-src 'self' data:",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
      ...(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ? ["upgrade-insecure-requests"] : []),
    ].join("; ");
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: csp },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
    ] }];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
});
