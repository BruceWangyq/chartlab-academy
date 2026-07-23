import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { lessonProgress, profiles, users } from "@/db/schema";
import { sendTransactionalEmail } from "@/lib/email";
import { safeEqual } from "@/lib/secure-compare";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "Reminder cron is not configured" }, { status: 503 });
  if (!safeEqual(request.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb(); if (!db) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  const cutoff = new Date(); cutoff.setUTCDate(cutoff.getUTCDate() - 7);
  const candidates = await db.select({ userId: users.id, email: users.email, createdAt: users.createdAt }).from(profiles).innerJoin(users, eq(users.id, profiles.userId)).where(and(eq(profiles.learningReminders, true), isNull(users.deletionRequestedAt), or(isNull(profiles.lastReminderAt), lt(profiles.lastReminderAt, cutoff)))).limit(100);
  let sent = 0;
  for (const candidate of candidates) {
    const [activity] = await db.select({ updatedAt: lessonProgress.updatedAt }).from(lessonProgress).where(eq(lessonProgress.userId, candidate.userId)).orderBy(desc(lessonProgress.updatedAt)).limit(1);
    if ((activity?.updatedAt ?? candidate.createdAt) >= cutoff) continue;
    const result = await sendTransactionalEmail(candidate.email, "learning_reminder").catch(() => ({ sent: false }));
    if (result.sent) { await db.update(profiles).set({ lastReminderAt: new Date() }).where(eq(profiles.userId, candidate.userId)); sent += 1; }
  }
  return NextResponse.json({ ok: true, evaluated: candidates.length, sent });
}
