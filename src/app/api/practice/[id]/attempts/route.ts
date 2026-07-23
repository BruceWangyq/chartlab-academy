import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { annotations, chartAttempts, chartCases as chartCaseRecords } from "@/db/schema";
import { getChartCase } from "@/lib/content-source";
import type { ChartCase } from "@/lib/content";
import { practiceSubmissionSchema, scorePractice } from "@/lib/scoring";
import { getSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { canAccessCase } from "@/lib/access";
import { captureProductEvent } from "@/lib/analytics";
import { hasMeaningfulLearningActivity } from "@/lib/learning-activity";
import { and, count, desc, eq, sql } from "drizzle-orm";

const draftSchema = z.object({
  trend: z.enum(["up", "down", "range"]), supportLow: z.string(), supportHigh: z.string(), resistanceLow: z.string(), resistanceHigh: z.string(),
  reasonTags: z.array(z.string()).max(8), reason: z.string().max(600), reactionPoints: z.string().max(120), annotations: z.array(z.object({ type: z.enum(["trendline", "zone", "label"]), points: z.array(z.object({ x: z.number(), y: z.number() })).max(2), label: z.string().optional() })).max(40),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const chartCase = await getChartCase(id);
  if (!chartCase) return NextResponse.json({ error: "未找到这个历史案例。" }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  const access = await canAccessCase(chartCase, session); if (!access.allowed) return quotaResponse();
  const rate = checkRateLimit(request, "practice-submit", 30, 60 * 60_000, id); if (!rate.allowed) return NextResponse.json({ error: "提交过于频繁，请稍后再试。" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const parsed = practiceSubmissionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "练习内容不完整，请检查趋势、区域和理由。", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const score = scorePractice(chartCase, parsed.data);
  const submittedAt = new Date();
  const db = getDb(); let attemptId = crypto.randomUUID(); let attemptNumber = 1; let hadLearningActivity = true;
  if (db) {
    try {
      await db.transaction(async (transaction) => {
        const transactionDb = transaction as unknown as NonNullable<ReturnType<typeof getDb>>;
        if (session.plan === "free") {
          const month = submittedAt.toISOString().slice(0, 7);
          await transaction.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`chart-case-quota:${session.id}:${month}`}, 0))`);
          const lockedAccess = await canAccessCase(chartCase, session, transactionDb);
          if (!lockedAccess.allowed) throw new CaseQuotaExceededError();
        }
        await ensureCase(transactionDb, chartCase);
        hadLearningActivity = await hasMeaningfulLearningActivity(transactionDb, session.id);
        const [previous] = await transaction.select({ value: count() }).from(chartAttempts).where(and(eq(chartAttempts.userId, session.id), eq(chartAttempts.caseId, chartCase.id), eq(chartAttempts.status, "submitted")));
        attemptNumber = previous.value + 1;
        const [attempt] = await transaction.insert(chartAttempts).values({ userId: session.id, caseId: chartCase.id, status: "submitted", snapshot: parsed.data, score, submittedAt }).returning({ id: chartAttempts.id });
        attemptId = attempt.id;
        if (parsed.data.annotations.length) await transaction.insert(annotations).values(parsed.data.annotations.map((annotation) => ({ attemptId, type: annotation.type, points: annotation.points, style: {}, label: annotation.label })));
      });
    } catch (error) {
      if (error instanceof CaseQuotaExceededError) return quotaResponse();
      throw error;
    }
  }
  await Promise.all([captureProductEvent("chart_case_submitted", session.id, { case_id: chartCase.id, difficulty: chartCase.difficulty, knowledge_tags: chartCase.knowledgeTags, attempt_number: attemptNumber, timestamp: submittedAt.toISOString() }), captureProductEvent("meaningful_learning_action", session.id, { action: "chart_case_submitted", case_id: chartCase.id, timestamp: submittedAt.toISOString() }), ...(!hadLearningActivity ? [captureProductEvent("first_learning_action", session.id, { action: "chart_case_submitted", case_id: chartCase.id, timestamp: submittedAt.toISOString() })] : [])]);
  return NextResponse.json({ attemptId, submittedAt: submittedAt.toISOString(), score, persisted: Boolean(db), reference: { trend: chartCase.expectedTrend, support: chartCase.support, resistance: chartCase.resistance } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id; const chartCase = await getChartCase(id);
  if (!chartCase) return NextResponse.json({ error: "未找到这个历史案例。" }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  const access = await canAccessCase(chartCase, session); if (!access.allowed) return quotaResponse();
  const rate = checkRateLimit(request, "practice-draft", 120, 60 * 60_000, `${session.id}:${id}`); if (!rate.allowed) return NextResponse.json({ error: "草稿保存过于频繁，请稍后再试。" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const parsed = draftSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "草稿格式不正确。" }, { status: 400 });
  const db = getDb();
  if (!db) return NextResponse.json({ persisted: false });
  await ensureCase(db, chartCase);
  const [existing] = await db.select({ id: chartAttempts.id }).from(chartAttempts).where(and(eq(chartAttempts.userId, session.id), eq(chartAttempts.caseId, chartCase.id), eq(chartAttempts.status, "draft"))).orderBy(desc(chartAttempts.createdAt)).limit(1);
  if (existing) { await db.update(chartAttempts).set({ snapshot: parsed.data }).where(eq(chartAttempts.id, existing.id)); return NextResponse.json({ persisted: true, attemptId: existing.id }); }
  const [attempt] = await db.insert(chartAttempts).values({ userId: session.id, caseId: chartCase.id, status: "draft", snapshot: parsed.data }).returning({ id: chartAttempts.id });
  return NextResponse.json({ persisted: true, attemptId: attempt.id });
}

async function ensureCase(db: NonNullable<ReturnType<typeof getDb>>, chartCase: ChartCase) {
  await db.insert(chartCaseRecords).values({ id: chartCase.id, datasetRef: `seed:${chartCase.seed}`, rubric: { trend: chartCase.expectedTrend, support: chartCase.support, resistance: chartCase.resistance }, visibility: "catalog", publishedAt: new Date() }).onConflictDoNothing();
}

class CaseQuotaExceededError extends Error {}

function quotaResponse() {
  return NextResponse.json({ error: "本月免费案例额度已用完，升级 Pro 可继续练习。" }, { status: 403 });
}
