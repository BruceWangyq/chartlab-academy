import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, FlaskConical, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getCourseModule, getCourseModules } from "@/lib/content-source";

export async function generateStaticParams() { return (await getCourseModules()).map((courseModule) => ({ slug: courseModule.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const courseModule = await getCourseModule((await params).slug);
  return courseModule ? { title: courseModule.title, description: courseModule.description, alternates: { canonical: `/courses/${courseModule.slug}` } } : {};
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const courseModule = await getCourseModule((await params).slug);
  if (!courseModule) notFound();
  const minutes = courseModule.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  const jsonLd = { "@context": "https://schema.org", "@type": "Course", name: courseModule.title, description: courseModule.description, provider: { "@type": "Organization", name: "ChartLab Academy", sameAs: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000" }, educationalLevel: "Beginner to intermediate", inLanguage: "zh-CN", numberOfCredits: courseModule.lessons.length, hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${minutes}M` } };
  return <><SiteHeader /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><main id="main-content" className="public-page">
    <section className="course-hero" style={{ "--module-accent": courseModule.accent } as React.CSSProperties}><div className="shell course-hero-grid">
      <div><Link className="back-link" href="/courses">← 返回课程地图</Link><span className="module-code">{courseModule.code}</span><h1>{courseModule.title}</h1><p>{courseModule.description}</p><div className="course-stats"><span><BookOpen size={17} />{courseModule.lessons.length} 节课</span><span><Clock3 size={17} />约 {minutes} 分钟</span><span><FlaskConical size={17} />含配套练习</span></div><Link className="button button-primary" href={`/learn/${courseModule.slug}/${courseModule.lessons[0].slug}`}>开始第一课 <ArrowRight size={18} /></Link></div>
      <aside><h2>完成这个模块后，你能：</h2><ul>{courseModule.lessons.slice(0, 4).map((lesson) => <li key={lesson.id}><CheckCircle2 />{lesson.objectives[0]}</li>)}</ul><p><ShieldCheck />课程仅用于教育，不提供交易建议。</p></aside>
    </div></section>
    <section className="shell lesson-list-section section-pad"><header><span className="eyebrow light"><span /> Lesson plan</span><h2>模块课程</h2></header><ol className="lesson-list">{courseModule.lessons.map((lesson, index) => <li key={lesson.id}><Link href={`/learn/${courseModule.slug}/${lesson.slug}`}><span className="lesson-index">{String(index + 1).padStart(2, "0")}</span><div><span className="lesson-number">第 {lesson.number} 节</span><h3>{lesson.title}</h3><p>{lesson.summary}</p><small><Clock3 size={14} />{lesson.duration} 分钟 · {lesson.quiz.length} 道测验</small></div><em>{lesson.free ? "免费" : "Pro"}</em><ArrowRight /></Link></li>)}</ol></section>
  </main></>;
}
