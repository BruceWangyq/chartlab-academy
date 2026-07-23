import { and, eq, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, bookmarks, chartAttempts, courseEnrollments, entitlements, lessonProgress, notes, profiles, quizAttempts, rateLimits, subscriptions, users } from "@/db/schema";
import { dataRetentionCutoffs, redactedAccountEmail } from "@/lib/data-retention";
import { safeEqual } from "@/lib/secure-compare";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "Data retention cron is not configured" }, { status: 503 });
  if (!safeEqual(request.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb(); if (!db) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  const now = new Date(); const cutoffs = dataRetentionCutoffs(now);
  const candidates = await db.select({ id: users.id }).from(users).where(and(isNotNull(users.deletionRequestedAt), isNull(users.anonymizedAt), lt(users.deletionRequestedAt, cutoffs.deletion))).limit(100);
  let anonymized = 0;
  for (const candidate of candidates) {
    await db.transaction(async (transaction) => {
      const [locked] = await transaction.select({ id: users.id }).from(users).where(and(eq(users.id, candidate.id), isNotNull(users.deletionRequestedAt), isNull(users.anonymizedAt), lt(users.deletionRequestedAt, cutoffs.deletion))).for("update").limit(1);
      if (!locked) return;
      await transaction.delete(profiles).where(eq(profiles.userId, candidate.id));
      await transaction.delete(courseEnrollments).where(eq(courseEnrollments.userId, candidate.id));
      await transaction.delete(lessonProgress).where(eq(lessonProgress.userId, candidate.id));
      await transaction.delete(quizAttempts).where(eq(quizAttempts.userId, candidate.id));
      await transaction.delete(chartAttempts).where(eq(chartAttempts.userId, candidate.id));
      await transaction.delete(notes).where(eq(notes.userId, candidate.id));
      await transaction.delete(bookmarks).where(eq(bookmarks.userId, candidate.id));
      await transaction.delete(entitlements).where(eq(entitlements.userId, candidate.id));
      await transaction.update(auditLogs).set({ actorId: null, resource: "user:redacted", metadata: { retained: "security_audit", anonymizedAt: now.toISOString() } }).where(eq(auditLogs.actorId, candidate.id));
      await transaction.update(users).set({ email: redactedAccountEmail(candidate.id), role: "learner", locale: "und", anonymizedAt: now }).where(eq(users.id, candidate.id));
      anonymized += 1;
    });
  }
  const expiredBillingAccounts = await db.select({ id: users.id }).from(users).where(and(isNotNull(users.anonymizedAt), lt(users.anonymizedAt, cutoffs.billing))).limit(100);
  const expiredIds = expiredBillingAccounts.map((item) => item.id);
  if (expiredIds.length) {
    await db.transaction(async (transaction) => {
      await transaction.delete(subscriptions).where(inArray(subscriptions.userId, expiredIds));
      await transaction.delete(users).where(inArray(users.id, expiredIds));
    });
  }
  const purgedAudit = await db.delete(auditLogs).where(lt(auditLogs.createdAt, cutoffs.securityAudit)).returning({ id: auditLogs.id });
  await db.delete(rateLimits).where(lt(rateLimits.resetAt, now));
  return NextResponse.json({ ok: true, evaluated: candidates.length, anonymized, billingRecordsPurged: expiredIds.length, auditRecordsPurged: purgedAudit.length, timestamp: now.toISOString() });
}
