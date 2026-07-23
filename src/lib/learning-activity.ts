import "server-only";
import { and, count, eq } from "drizzle-orm";
import type { getDb } from "@/db";
import { chartAttempts, lessonProgress, quizAttempts } from "@/db/schema";

type Database = NonNullable<ReturnType<typeof getDb>>;

export async function hasMeaningfulLearningActivity(db: Database, userId: string) {
  const [[lessons], [quizzes], [practices]] = await Promise.all([
    db.select({ value: count() }).from(lessonProgress).where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.status, "completed"))),
    db.select({ value: count() }).from(quizAttempts).where(eq(quizAttempts.userId, userId)),
    db.select({ value: count() }).from(chartAttempts).where(and(eq(chartAttempts.userId, userId), eq(chartAttempts.status, "submitted"))),
  ]);
  return lessons.value + quizzes.value + practices.value > 0;
}
