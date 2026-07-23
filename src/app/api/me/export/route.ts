import { asc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, annotations, bookmarks, chartAttempts, courseEnrollments, lessonProgress, notes, profiles, quizAttempts, subscriptions, users } from "@/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession(); if (!session) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  const rate = await checkRateLimit(request, "account-export", 3, 24 * 60 * 60_000, session.id); if (!rate.allowed) return NextResponse.json({ error: "导出请求过于频繁，请稍后再试。" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const db = getDb(); if (!db) return NextResponse.json({ error: "本地演示尚未连接账户数据库。" }, { status: 503 });
  const [accountRows, profileRows, enrollmentRows, progressRows, quizRows, attemptRows, noteRows, bookmarkRows, subscriptionRows, auditRows] = await Promise.all([
    db.select({ id: users.id, email: users.email, role: users.role, locale: users.locale, createdAt: users.createdAt }).from(users).where(eq(users.id, session.id)),
    db.select().from(profiles).where(eq(profiles.userId, session.id)),
    db.select().from(courseEnrollments).where(eq(courseEnrollments.userId, session.id)).orderBy(asc(courseEnrollments.startedAt)),
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, session.id)).orderBy(asc(lessonProgress.updatedAt)),
    db.select().from(quizAttempts).where(eq(quizAttempts.userId, session.id)).orderBy(asc(quizAttempts.createdAt)),
    db.select().from(chartAttempts).where(eq(chartAttempts.userId, session.id)).orderBy(asc(chartAttempts.createdAt)),
    db.select().from(notes).where(eq(notes.userId, session.id)).orderBy(asc(notes.updatedAt)),
    db.select().from(bookmarks).where(eq(bookmarks.userId, session.id)).orderBy(asc(bookmarks.createdAt)),
    db.select({ planKey: subscriptions.planKey, status: subscriptions.status, periodEnd: subscriptions.periodEnd, graceEndsAt: subscriptions.graceEndsAt, updatedAt: subscriptions.updatedAt }).from(subscriptions).where(eq(subscriptions.userId, session.id)).orderBy(asc(subscriptions.updatedAt)),
    db.select({ action: auditLogs.action, resource: auditLogs.resource, metadata: auditLogs.metadata, createdAt: auditLogs.createdAt }).from(auditLogs).where(eq(auditLogs.actorId, session.id)).orderBy(asc(auditLogs.createdAt)),
  ]);
  const attemptIds = attemptRows.map((item) => item.id);
  const annotationRows = attemptIds.length ? await db.select().from(annotations).where(inArray(annotations.attemptId, attemptIds)) : [];
  const payload = { exportedAt: new Date().toISOString(), formatVersion: 1, account: accountRows[0] ?? null, profile: profileRows[0] ?? null, courseEnrollments: enrollmentRows, lessonProgress: progressRows, quizAttempts: quizRows, chartAttempts: attemptRows, annotations: annotationRows, notes: noteRows, bookmarks: bookmarkRows, subscriptions: subscriptionRows, auditHistory: auditRows };
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="chartlab-data-${date}.json"`, "Cache-Control": "private, no-store" } });
}
