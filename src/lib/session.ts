import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, entitlements, profiles, subscriptions, users } from "@/db/schema";
import { sendTransactionalEmail } from "@/lib/email";
import { captureProductEvent } from "@/lib/analytics";
import { manualEntitlementGrantsPro, subscriptionGrantsPro } from "@/lib/entitlement-policy";

const SESSION_COOKIE = "chartlab_session";
const OTP_COOKIE = "chartlab_otp";
// Secure cookies are always on in production. The PLAYWRIGHT_TEST escape is only honoured
// off Vercel (local built-server e2e over http); it can never disable Secure on a real deploy.
const secureCookie = () => process.env.NODE_ENV === "production" && !(process.env.PLAYWRIGHT_TEST === "true" && !process.env.VERCEL_ENV);
const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) throw new Error("AUTH_SECRET must contain at least 32 characters in production");
  return new TextEncoder().encode(value ?? "local-development-secret-change-before-production");
};

export type SessionUser = { id: string; email: string; role: "learner" | "editor" | "admin"; plan: "free" | "pro"; onboarded: boolean; authMethod: "email_otp" | "google" };

export async function signToken(payload: Record<string, unknown>, expiresIn: string | number) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expiresIn).sign(secret());
}
export async function verifyToken<T>(token: string): Promise<T | null> { try { return (await jwtVerify(token, secret())).payload as T; } catch { return null; } }
export async function setSession(user: SessionUser) { const store = await cookies(); store.set(SESSION_COOKIE, await signToken(user, "7d"), { httpOnly: true, sameSite: "lax", secure: secureCookie(), path: "/", maxAge: 60 * 60 * 24 * 7 }); }
export async function createSessionForEmail(email: string, authMethod: SessionUser["authMethod"] = "email_otp") {
  const normalizedEmail = email.trim().toLowerCase();
  const db = getDb();
  if (!db) {
    const user = { id: crypto.randomUUID(), email: normalizedEmail, role: roleForEmail(normalizedEmail), plan: "free", onboarded: true, authMethod } satisfies SessionUser;
    await setSession(user);
    return user;
  }
  const desiredRole = roleForEmail(normalizedEmail);
  const inserted = await db.insert(users).values({ email: normalizedEmail, role: desiredRole }).onConflictDoNothing().returning();
  let [record] = inserted.length ? inserted : await db.update(users).set(desiredRole === "admin" ? { role: "admin" } : { email: normalizedEmail }).where(eq(users.email, normalizedEmail)).returning();
  if (record.deletionRequestedAt && !record.anonymizedAt) {
    [record] = await db.update(users).set({ deletionRequestedAt: null }).where(eq(users.id, record.id)).returning();
    await db.insert(auditLogs).values({ actorId: record.id, action: "account.deletion_cancelled", resource: `user:${record.id}`, metadata: { cancelledAt: new Date().toISOString(), method: "verified_login" } });
  }
  const user = await resolveAccount({ id: record.id, email: record.email, role: record.role, plan: "free", onboarded: false, authMethod });
  if (!user) throw new Error("Failed to create user session");
  await setSession(user);
  if (inserted.length) { void sendTransactionalEmail(normalizedEmail, "welcome").catch(() => undefined); void captureProductEvent("sign_up_completed", user.id, { locale: "zh-CN", timestamp: new Date().toISOString() }); }
  return user;
}
export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken<SessionUser>(token) : null;
  if (!session) return null;
  return resolveAccount(session);
}
export async function clearSession() { (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: secureCookie(), path: "/", maxAge: 0 }); }
export type OtpPayload = { email: string; code: string; attempts?: number };
export async function setOtp(payload: OtpPayload, expiresAt?: number) {
  const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expiresAt ?? "10m").sign(secret());
  (await cookies()).set(OTP_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: secureCookie(), path: "/api/auth", maxAge: 600 });
}
export async function getOtp() { const token = (await cookies()).get(OTP_COOKIE)?.value; return token ? verifyToken<OtpPayload & { exp?: number }>(token) : null; }
export async function clearOtp() { (await cookies()).set(OTP_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: secureCookie(), path: "/api/auth", maxAge: 0 }); }

function roleForEmail(email: string): SessionUser["role"] {
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email) ? "admin" : "learner";
}

async function resolveAccount(session: SessionUser): Promise<SessionUser | null> {
  const db = getDb();
  if (!db) return { ...session, onboarded: session.onboarded ?? true, authMethod: session.authMethod ?? "email_otp" };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(session.id)) return null;
  const [account] = await db.select({ id: users.id, email: users.email, role: users.role, deletionRequestedAt: users.deletionRequestedAt, anonymizedAt: users.anonymizedAt }).from(users).where(eq(users.id, session.id)).limit(1);
  if (!account || account.deletionRequestedAt || account.anonymizedAt) return null;
  const now = new Date();
  const [[profile], subscriptionRecords, manualEntitlementRecords] = await Promise.all([
    db.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.userId, account.id)).limit(1),
    db.select({ status: subscriptions.status, graceEndsAt: subscriptions.graceEndsAt }).from(subscriptions).where(eq(subscriptions.userId, account.id)).orderBy(desc(subscriptions.updatedAt)).limit(20),
    db.select({ expiresAt: entitlements.expiresAt }).from(entitlements).where(and(eq(entitlements.userId, account.id), eq(entitlements.key, "pro"))).limit(20),
  ]);
  const hasPro = subscriptionRecords.some((record) => subscriptionGrantsPro(record, now)) || manualEntitlementRecords.some((record) => manualEntitlementGrantsPro(record.expiresAt, now));
  return { id: account.id, email: account.email, role: account.role, plan: hasPro ? "pro" : "free", onboarded: Boolean(profile), authMethod: session.authMethod ?? "email_otp" };
}
export function hasAdminAssurance(session: SessionUser) { return session.role === "admin" && (session.authMethod === "google" || process.env.ADMIN_ALLOW_EMAIL_OTP === "true"); }
