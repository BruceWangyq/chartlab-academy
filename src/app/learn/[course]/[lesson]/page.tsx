import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, ArrowRight, BookOpen, CheckCircle2, Clock3, FlaskConical } from "lucide-react";
import { LessonActions } from "@/components/lesson-actions";
import { LessonNote } from "@/components/lesson-note";
import { MarketChart } from "@/components/market-chart";
import { QuizBlock } from "@/components/quiz-block";
import { SiteHeader } from "@/components/site-header";
import { getChartCases, getCourseLesson, getCourseModules } from "@/lib/content-source";
import { getSession } from "@/lib/session";
import { getCourseRuntimeConfig } from "@/lib/cms";
import { canAccessLessonInSequence } from "@/lib/access";
import { LessonVideo } from "@/components/lesson-video";

export async function generateStaticParams() { return (await getCourseModules()).flatMap((courseModule) => courseModule.lessons.map((lesson) => ({ course: courseModule.slug, lesson: lesson.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ course: string; lesson: string }> }): Promise<Metadata> { const route = await params; const data = await getCourseLesson(route.course, route.lesson); return data ? { title: data.lesson.title, description: data.lesson.summary } : {}; }

export default async function LessonPage({ params, searchParams }: { params: Promise<{ course: string; lesson: string }>; searchParams: Promise<{ locked?: string }> }) {
  const [route, query] = await Promise.all([params, searchParams]); const data = await getCourseLesson(route.course, route.lesson); if (!data) notFound();
  const { lesson, module: courseModule } = data; const [allModules, chartCases] = await Promise.all([getCourseModules(), getChartCases()]); const lessons = allModules.flatMap((item) => item.lessons); const lessonIndex = lessons.findIndex((item) => item.id === lesson.id); const next = lessons[lessonIndex + 1]; const relatedCase = chartCases[(lessonIndex * 3) % chartCases.length];
  const session = await getSession(); if (!lesson.free) { if (!session) redirect(`/login?next=/learn/${route.course}/${route.lesson}`); if (session.plan !== "pro") redirect(`/pricing?limit=course&from=/learn/${route.course}/${route.lesson}`); } const config = await getCourseRuntimeConfig(courseModule.slug); const sequence = await canAccessLessonInSequence(courseModule, lesson, session, config.enforceSequence); if (!sequence.allowed && sequence.reason === "login") redirect(`/login?next=/learn/${route.course}/${route.lesson}`); if (!sequence.allowed) redirect(`/learn/${route.course}/${sequence.previous.slug}?locked=${lesson.slug}`); const accountSync = Boolean(session && process.env.DATABASE_URL);
  return <><SiteHeader /><main id="main-content" className="lesson-workspace">
    <aside className="lesson-sidebar"><div><Link href={`/courses/${courseModule.slug}`}>← {courseModule.title}</Link><span>课程进度 <b>{Math.round(((courseModule.lessons.findIndex((item) => item.id === lesson.id) + 1) / courseModule.lessons.length) * 100)}%</b></span><i><b style={{ width: `${((courseModule.lessons.findIndex((item) => item.id === lesson.id) + 1) / courseModule.lessons.length) * 100}%` }} /></i></div><nav aria-label="本模块课程">{courseModule.lessons.map((item) => <Link className={item.id === lesson.id ? "active" : ""} href={`/learn/${courseModule.slug}/${item.slug}`} key={item.id}><span>{item.number}</span>{item.title}{item.id === lesson.id ? <i /> : <CheckCircle2 />}</Link>)}</nav></aside>
    <article className="lesson-content"><nav className="breadcrumbs"><Link href="/courses">课程</Link><span>›</span><Link href={`/courses/${courseModule.slug}`}>{courseModule.title}</Link><span>›</span><b>{lesson.number}</b></nav>{query.locked && <div className="lesson-lock-notice" role="status"><AlertTriangle /><div><strong>先完成当前课程</strong><p>管理员为这个模块开启了顺序学习。标记本课完成后即可进入下一节。</p></div></div>}<header className="lesson-title"><span>第 {lesson.number} 节</span><h1>{lesson.title}</h1><div><Clock3 size={16} />预计学习 {lesson.duration} 分钟</div><p>{lesson.summary}</p><LessonActions lessonId={lesson.id} accountSync={accountSync} /></header>
      <section className="lesson-objectives" aria-labelledby="lesson-objectives-title"><h2 id="lesson-objectives-title">学完本课，你将能够</h2><ul>{lesson.objectives.map((item) => <li key={item}><CheckCircle2 />{item}</li>)}</ul></section>
      <div className="concept-grid"><section><BookOpen /><div><h2>核心概念</h2><ul>{lesson.concepts.map((item) => <li key={item}>{item}</li>)}</ul></div></section><section className="mistakes"><AlertTriangle /><div><h2>常见误区</h2><ul>{lesson.mistakes.map((item) => <li key={item}>{item}</li>)}</ul></div></section></div>
      {lesson.video && <LessonVideo lessonId={lesson.id} playbackId={lesson.video.playbackId} transcript={lesson.video.transcript} signed={lesson.video.signed} accountSync={accountSync} />}
      {lesson.sections.map((section, index) => <section className="lesson-prose" id={`section-${index + 1}`} key={section.title}><h2>{section.title}</h2>{section.body.map((body) => <p key={body}>{body}</p>)}{section.images?.map((item) => <figure className="lesson-cms-image" key={item.url}><Image src={item.url} alt={item.alt} width={1280} height={720} sizes="(max-width: 900px) 100vw, 760px" /><figcaption>{item.alt}</figcaption></figure>)}</section>)}
      <figure className="lesson-chart"><figcaption><b>示例图表：把观察与解释分开</b><span>历史模拟数据 · 日线</span></figcaption><MarketChart seed={lessonIndex + 41} height={360} ariaLabel={`${lesson.title}教学示例K线图`} showDataSummary /><p>先写出价格形成的高低点和关键反应，再判断这些事实是否支持你的结构结论。</p></figure>
      <section className="knowledge-card"><span>本课知识卡</span><h2>{lesson.title}</h2><p>{lesson.summary}</p><dl><div><dt>观察</dt><dd>{lesson.concepts.join(" · ")}</dd></div><div><dt>警惕</dt><dd>{lesson.mistakes.join("；")}</dd></div><div><dt>复盘问题</dt><dd>什么证据会推翻当前判断？</dd></div></dl></section>
      <QuizBlock lessonId={lesson.id} questions={lesson.quiz} />
      <section className="practice-prompt"><FlaskConical /><div><span>立即练习</span><h2>{relatedCase.title}</h2><p>{relatedCase.description}</p></div><Link className="button button-primary" href={`/practice/${relatedCase.slug}`}>进入案例 <ArrowRight size={17} /></Link></section>
      <p className="lesson-disclaimer"><AlertTriangle />本课程只用于教育与研究，不构成投资建议；历史表现不代表未来结果。</p>
      {next && <Link className="next-lesson" href={`/learn/${allModules.find((item) => item.lessons.some((entry) => entry.id === next.id))?.slug}/${next.slug}`}><span>下一课</span><b>{next.title}</b><ArrowRight /></Link>}
    </article>
    <aside className="lesson-right"><LessonNote lessonId={lesson.id} accountSync={accountSync} /><nav><h2>本课大纲</h2>{lesson.sections.map((section, index) => <a href={`#section-${index + 1}`} key={section.title}><span>{index + 1}</span>{section.title}</a>)}<a href="#"><span>{lesson.sections.length + 1}</span>随堂小测</a></nav></aside>
  </main></>;
}
