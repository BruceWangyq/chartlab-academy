import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { quizAttempts } from "@/db/schema";
import { getAllLessons } from "@/lib/content-source";
import { getSession } from "@/lib/session";
import { captureProductEvent } from "@/lib/analytics";
import { hasMeaningfulLearningActivity } from "@/lib/learning-activity";

const schema = z.object({ lessonId: z.string().min(1), answers: z.record(z.string(), z.number().int().min(0).max(5)) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "测验答案格式不正确。" }, { status: 400 });
  const lesson = (await getAllLessons()).find((item) => item.id === parsed.data.lessonId);
  if (!lesson) return NextResponse.json({ error: "课程不存在。" }, { status: 404 });
  if (!lesson.quiz.every((question) => parsed.data.answers[question.id] !== undefined)) return NextResponse.json({ error: "请完成全部题目。" }, { status: 400 });
  const score = lesson.quiz.filter((question) => parsed.data.answers[question.id] === question.answer).length;
  const session = await getSession();
  const db = getDb();
  const hadLearningActivity = session && db ? await hasMeaningfulLearningActivity(db, session.id) : true;
  if (session && db) await db.insert(quizAttempts).values({ userId: session.id, quizId: lesson.id, answers: parsed.data.answers, score });
  if (session) await Promise.all([captureProductEvent("quiz_submitted", session.id, { course_id: lesson.id.split("-l")[0], module_id: lesson.id.split("-l")[0], lesson_id: lesson.id, content_version: "v1", score, timestamp: new Date().toISOString() }), captureProductEvent("meaningful_learning_action", session.id, { action: "quiz_submitted", lesson_id: lesson.id, timestamp: new Date().toISOString() }), ...(!hadLearningActivity ? [captureProductEvent("first_learning_action", session.id, { action: "quiz_submitted", lesson_id: lesson.id, timestamp: new Date().toISOString() })] : [])]);
  return NextResponse.json({ score, total: lesson.quiz.length, persisted: Boolean(session && db) });
}
