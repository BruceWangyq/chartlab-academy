import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { bookmarks, courseEnrollments, lessonProgress, notes } from "@/db/schema";
import { getAllLessons } from "@/lib/content-source";
import { getSession } from "@/lib/session";
import { FREE_PERSONAL_ITEM_LIMIT } from "@/lib/access";
import { captureProductEvent } from "@/lib/analytics";
import { hasMeaningfulLearningActivity } from "@/lib/learning-activity";

const updateSchema = z.object({
  completed: z.boolean().optional(),
  positionSeconds: z.number().int().min(0).max(86_400).optional(),
  bookmarked: z.boolean().optional(),
  note: z.string().max(1000).optional(),
}).refine((value) => Object.keys(value).length > 0);

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getContext((await params).id);
  if (context instanceof NextResponse) return context;
  const { db, session, lessonId } = context;
  const [progress] = await db.select().from(lessonProgress).where(and(eq(lessonProgress.userId, session.id), eq(lessonProgress.lessonId, lessonId))).limit(1);
  const [note] = await db.select().from(notes).where(and(eq(notes.userId, session.id), eq(notes.targetType, "lesson"), eq(notes.targetId, lessonId))).limit(1);
  const [bookmark] = await db.select().from(bookmarks).where(and(eq(bookmarks.userId, session.id), eq(bookmarks.targetType, "lesson"), eq(bookmarks.targetId, lessonId))).limit(1);
  return NextResponse.json({ completed: progress?.status === "completed", bookmarked: Boolean(bookmark), note: note?.content ?? "" });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getContext((await params).id);
  if (context instanceof NextResponse) return context;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "学习记录格式不正确。" }, { status: 400 });
  const { db, session, lessonId } = context;
  if (parsed.data.completed !== undefined || parsed.data.positionSeconds !== undefined) {
    const [before] = await db.select({ status: lessonProgress.status }).from(lessonProgress).where(and(eq(lessonProgress.userId, session.id), eq(lessonProgress.lessonId, lessonId))).limit(1);
    const hadLearningActivity = parsed.data.completed === true && before?.status !== "completed" ? await hasMeaningfulLearningActivity(db, session.id) : true;
    await db.insert(courseEnrollments).values({ userId: session.id, courseId: "chart-foundations" }).onConflictDoNothing();
    const status = parsed.data.completed ? "completed" : "in_progress";
    const values = { userId: session.id, lessonId, status, positionSeconds: parsed.data.positionSeconds ?? 0, updatedAt: new Date() } as const;
    await db.insert(lessonProgress).values(values).onConflictDoUpdate({ target: [lessonProgress.userId, lessonProgress.lessonId], set: { ...(parsed.data.completed !== undefined ? { status } : {}), ...(parsed.data.positionSeconds !== undefined ? { positionSeconds: parsed.data.positionSeconds } : {}), updatedAt: new Date() } });
    if (parsed.data.completed === true && before?.status !== "completed") { await Promise.all([captureProductEvent("lesson_completed", session.id, { course_id: lessonId.split("-l")[0], module_id: lessonId.split("-l")[0], lesson_id: lessonId, content_version: "v1", timestamp: new Date().toISOString() }), captureProductEvent("meaningful_learning_action", session.id, { action: "lesson_completed", lesson_id: lessonId, timestamp: new Date().toISOString() }), ...(!hadLearningActivity ? [captureProductEvent("first_learning_action", session.id, { action: "lesson_completed", lesson_id: lessonId, timestamp: new Date().toISOString() })] : [])]); }
  }
  if (parsed.data.bookmarked !== undefined) {
    if (parsed.data.bookmarked) {
      const [existing] = await db.select().from(bookmarks).where(and(eq(bookmarks.userId, session.id), eq(bookmarks.targetType, "lesson"), eq(bookmarks.targetId, lessonId))).limit(1);
      if (!existing && session.plan !== "pro") { const [usage] = await db.select({ value: count() }).from(bookmarks).where(eq(bookmarks.userId, session.id)); if (usage.value >= FREE_PERSONAL_ITEM_LIMIT) return NextResponse.json({ error: "免费账户最多收藏20条，升级 Pro 可继续收藏。", upgradeRequired: true }, { status: 403 }); }
      await db.insert(bookmarks).values({ userId: session.id, targetType: "lesson", targetId: lessonId }).onConflictDoNothing();
    }
    else await db.delete(bookmarks).where(and(eq(bookmarks.userId, session.id), eq(bookmarks.targetType, "lesson"), eq(bookmarks.targetId, lessonId)));
  }
  if (parsed.data.note !== undefined) {
    if (!parsed.data.note.trim()) await db.delete(notes).where(and(eq(notes.userId, session.id), eq(notes.targetType, "lesson"), eq(notes.targetId, lessonId)));
    else {
      const [existing] = await db.select().from(notes).where(and(eq(notes.userId, session.id), eq(notes.targetType, "lesson"), eq(notes.targetId, lessonId))).limit(1);
      if (!existing && session.plan !== "pro") { const [usage] = await db.select({ value: count() }).from(notes).where(eq(notes.userId, session.id)); if (usage.value >= FREE_PERSONAL_ITEM_LIMIT) return NextResponse.json({ error: "免费账户最多保存20条笔记，升级 Pro 可继续记录。", upgradeRequired: true }, { status: 403 }); }
      await db.insert(notes).values({ userId: session.id, targetType: "lesson", targetId: lessonId, content: parsed.data.note, updatedAt: new Date() }).onConflictDoUpdate({ target: [notes.userId, notes.targetType, notes.targetId], set: { content: parsed.data.note, updatedAt: new Date() } });
    }
  }
  return NextResponse.json({ ok: true });
}

async function getContext(lessonId: string) {
  if (!(await getAllLessons()).some((lesson) => lesson.id === lessonId)) return NextResponse.json({ error: "课程不存在。" }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "本地演示模式使用浏览器保存。" }, { status: 503 });
  return { db, session, lessonId };
}
