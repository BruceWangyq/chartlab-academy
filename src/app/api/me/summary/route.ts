import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { bookmarks, chartAttempts, lessonProgress, notes, profiles, quizAttempts } from "@/db/schema";
import { getSession } from "@/lib/session";
import { learningStreak, startOfUtcWeek } from "@/lib/learning-habits";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "本地演示模式使用浏览器汇总。" }, { status: 503 });
  const weekStart = startOfUtcWeek();
  const [completedLessons, [noteCount], submittedAttempts, [bookmarkCount], quizRecords, [profile]] = await Promise.all([
    db.select({ lessonId: lessonProgress.lessonId, updatedAt: lessonProgress.updatedAt }).from(lessonProgress).where(and(eq(lessonProgress.userId, session.id), eq(lessonProgress.status, "completed"))),
    db.select({ value: count() }).from(notes).where(eq(notes.userId, session.id)),
    db.select({ createdAt: chartAttempts.createdAt }).from(chartAttempts).where(and(eq(chartAttempts.userId, session.id), eq(chartAttempts.status, "submitted"))),
    db.select({ value: count() }).from(bookmarks).where(eq(bookmarks.userId, session.id)),
    db.select({ createdAt: quizAttempts.createdAt }).from(quizAttempts).where(eq(quizAttempts.userId, session.id)),
    db.select({ weeklyMinutes: profiles.weeklyMinutes }).from(profiles).where(eq(profiles.userId, session.id)).limit(1),
  ]);
  const streak = learningStreak([...completedLessons.map((item) => item.updatedAt), ...submittedAttempts.map((item) => item.createdAt), ...quizRecords.map((item) => item.createdAt)]);
  return NextResponse.json({ complete: completedLessons.length, completedLessonIds: completedLessons.map((item) => item.lessonId), notes: noteCount.value, attempts: submittedAttempts.length, quizzes: quizRecords.length, bookmarks: bookmarkCount.value, weeklyLessonIds: completedLessons.filter((item) => item.updatedAt >= weekStart).map((item) => item.lessonId), weeklyAttempts: submittedAttempts.filter((item) => item.createdAt >= weekStart).length, weeklyGoal: profile?.weeklyMinutes ?? 90, currentStreak: streak.current, longestStreak: streak.longest });
}
