import type { Metadata } from "next";
import { and, desc, eq, gte } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { SiteHeader } from "@/components/site-header";
import { getDb } from "@/db";
import { chartAttempts, quizAttempts } from "@/db/schema";
import { getChartCases, getCourseModules } from "@/lib/content-source";
import type { PracticeScore } from "@/lib/scoring";
import { getSession } from "@/lib/session";
import { FREE_REVIEW_DAYS } from "@/lib/access";
export const metadata: Metadata = { title: "练习复盘", robots: { index: false } };
export default async function ReviewPage() {
  const session = await getSession(); if (!session) redirect("/login?next=/review");
  const db = getDb(); const cutoff = new Date(); cutoff.setUTCDate(cutoff.getUTCDate() - FREE_REVIEW_DAYS);
  const [records, quizRecords, chartCases, modules] = await Promise.all([
    db ? db.select().from(chartAttempts).where(session.plan === "pro" ? eq(chartAttempts.userId, session.id) : and(eq(chartAttempts.userId, session.id), gte(chartAttempts.createdAt, cutoff))).orderBy(desc(chartAttempts.createdAt)).limit(100) : [],
    db ? db.select().from(quizAttempts).where(session.plan === "pro" ? eq(quizAttempts.userId, session.id) : and(eq(quizAttempts.userId, session.id), gte(quizAttempts.createdAt, cutoff))).orderBy(desc(quizAttempts.createdAt)).limit(100) : [],
    getChartCases(), getCourseModules(),
  ]);
  const scores = records.map((record) => record.score as PracticeScore | null).filter((score): score is PracticeScore => Boolean(score));
  const averages = scores.length ? {
    trend: Math.round(scores.reduce((sum, score) => sum + score.trend / 40 * 100, 0) / scores.length),
    zones: Math.round(scores.reduce((sum, score) => sum + (score.zones + (score.keyPoints ?? 0)) / 40 * 100, 0) / scores.length),
    reasoning: Math.round(scores.reduce((sum, score) => sum + score.reasoning / 20 * 100, 0) / scores.length),
  } : null;
  const recommendations = {
    trend: { label: "趋势结构", tag: "趋势", copy: "加强高低点序列和结构转换训练" },
    zones: { label: "区域标记", tag: "支撑阻力", copy: "复习区域宽度、反应密集带与角色转换" },
    reasoning: { label: "理由与失效", tag: "风险边界", copy: "练习把观察证据和失效条件写完整" },
  };
  const weakest = averages ? (Object.entries(averages).sort((a, b) => a[1] - b[1])[0][0] as keyof typeof recommendations) : null;
  const recommendedCase = weakest ? chartCases.find((item) => item.knowledgeTags.some((tag) => tag.includes(recommendations[weakest].tag))) ?? chartCases[0] : null;
  const wrongReviews = quizRecords.flatMap((record) => {
    const courseModule = modules.find((item) => item.lessons.some((lesson) => lesson.id === record.quizId)); const lesson = courseModule?.lessons.find((item) => item.id === record.quizId); if (!lesson || !courseModule) return [];
    const answers = record.answers as Record<string, number>; const wrong = lesson.quiz.filter((question) => answers[question.id] !== question.answer); if (!wrong.length) return [];
    return [{ id: record.id, createdAt: record.createdAt, lesson, courseModule, wrong }];
  });
  return <><SiteHeader /><main id="main-content" className="account-page shell"><AccountNav active="/review" /><header><span>Review</span><h1>练习复盘</h1><p>查看每次提交的快照与可解释评分；草稿也会保留。</p>{session.plan !== "pro" && <small>免费账户显示最近 {FREE_REVIEW_DAYS} 天记录。<Link href="/pricing?limit=review">查看 Pro 完整历史</Link></small>}</header>
    {averages && weakest && recommendedCase && <section className="review-insight"><div><span>当前薄弱项</span><h2>{recommendations[weakest].label} · {averages[weakest]}%</h2><p>{recommendations[weakest].copy}。该建议基于当前可见提交的三项归一化平均分。</p></div><dl><div><dt>趋势判断</dt><dd>{averages.trend}%</dd></div><div><dt>区域标记</dt><dd>{averages.zones}%</dd></div><div><dt>理由质量</dt><dd>{averages.reasoning}%</dd></div></dl><Link className="button button-primary" href={`/practice/${recommendedCase.slug}`}>开始推荐练习</Link></section>}
    <section className="quiz-review"><header><div><span>Quiz review</span><h2>错题回看</h2></div><small>{wrongReviews.length ? `${wrongReviews.length} 次测验需要复习` : "当前可见测验没有错题"}</small></header>{wrongReviews.length ? <div>{wrongReviews.slice(0, 8).map((review) => <article key={review.id}><small>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(review.createdAt)}</small><h3>{review.lesson.title}</h3><ul>{review.wrong.map((question) => <li key={question.id}><b>{question.prompt}</b><span>{question.explanation}</span></li>)}</ul><Link href={`/learn/${review.courseModule.slug}/${review.lesson.slug}`}>返回课程重做 →</Link></article>)}</div> : <div className="account-empty"><p>完成课程测验后，答错题目的解析会汇总在这里。</p><Link className="button button-primary" href="/courses">进入课程</Link></div>}</section>
    <div className="review-grid">{records.length ? records.map((record) => { const chartCase = chartCases.find((item) => item.id === record.caseId); const score = record.score as PracticeScore | null; return <article key={record.id}><header><span>{record.status === "submitted" ? "已提交" : "草稿"}</span><strong>{score ? `${score.total}/100` : "—"}</strong></header><h2>{chartCase?.title ?? record.caseId}</h2><p>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(record.createdAt)}</p>{score && <dl><div><dt>趋势</dt><dd>{score.trend}/40</dd></div><div><dt>区域与反应点</dt><dd>{score.zones + (score.keyPoints ?? 0)}/40</dd></div><div><dt>理由</dt><dd>{score.reasoning}/20</dd></div></dl>}{chartCase && <Link href={`/practice/${chartCase.slug}`}>重新练习 →</Link>}</article>; }) : <div className="account-empty"><p>还没有可显示的练习记录。完成一次历史案例后，评分与快照会出现在这里。</p><Link className="button button-primary" href="/cases">进入案例库</Link></div>}</div>
  </main></>;
}
