import type { Instrumentation } from "next";
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
  console.info(JSON.stringify({ level: "info", event: "service.started", service: "chartlab-academy", runtime: process.env.NEXT_RUNTIME ?? "nodejs" }));
}

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  Sentry.captureRequestError(error, request, context);
  const value = error instanceof Error ? error : new Error("Unknown request error");
  console.error(JSON.stringify({ level: "error", event: "request.failed", service: "chartlab-academy", method: request.method, path: request.path, route: context.routePath, routeType: context.routeType, error: { name: value.name, message: value.message }, timestamp: new Date().toISOString() }));
};
