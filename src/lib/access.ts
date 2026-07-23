import "server-only";
import { and, countDistinct, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { chartAttempts } from "@/db/schema";
import type { ChartCase } from "@/lib/content";
import type { CourseModule, Lesson } from "@/lib/content";
import type { SessionUser } from "@/lib/session";
import { lessonProgress } from "@/db/schema";
import { decideCaseAccess } from "@/lib/case-access-policy";

export { FREE_CASES_PER_MONTH } from "@/lib/case-access-policy";
export const FREE_PERSONAL_ITEM_LIMIT = 20;
export const FREE_REVIEW_DAYS = 7;

type DatabaseClient = NonNullable<ReturnType<typeof getDb>>;

export async function canAccessCase(chartCase: ChartCase, session: SessionUser | null, database: DatabaseClient | null = getDb()) {
  const initial = decideCaseAccess({ signedIn: Boolean(session), plan: session?.plan ?? "free", databaseConfigured: Boolean(database), includedInLocalDemo: chartCase.free });
  if (!session || session.plan === "pro" || !database) return initial;
  const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
  const [[usage], [existing]] = await Promise.all([
    database.select({ value: countDistinct(chartAttempts.caseId) }).from(chartAttempts).where(and(eq(chartAttempts.userId, session.id), eq(chartAttempts.status, "submitted"), gte(chartAttempts.submittedAt, start))),
    database.select({ value: countDistinct(chartAttempts.caseId) }).from(chartAttempts).where(and(eq(chartAttempts.userId, session.id), eq(chartAttempts.caseId, chartCase.id), eq(chartAttempts.status, "submitted"), gte(chartAttempts.submittedAt, start))),
  ]);
  return decideCaseAccess({ signedIn: true, plan: session.plan, databaseConfigured: true, usedThisMonth: usage.value, alreadyUsedThisCase: existing.value > 0 });
}

export async function canAccessLessonInSequence(courseModule: CourseModule, lesson: Lesson, session: SessionUser | null, enforceSequence: boolean) {
  const index = courseModule.lessons.findIndex((item) => item.id === lesson.id); const previous = courseModule.lessons[index - 1];
  if (!enforceSequence || !previous) return { allowed: true as const };
  if (!session) return { allowed: false as const, reason: "login" as const, previous };
  const db = getDb(); if (!db) return { allowed: false as const, reason: "locked" as const, previous };
  const [progress] = await db.select({ status: lessonProgress.status }).from(lessonProgress).where(and(eq(lessonProgress.userId, session.id), eq(lessonProgress.lessonId, previous.id))).limit(1);
  return progress?.status === "completed" ? { allowed: true as const } : { allowed: false as const, reason: "locked" as const, previous };
}
