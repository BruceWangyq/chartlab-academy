import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Clock3 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getCourseModules } from "@/lib/content-source";

export const metadata: Metadata = { title: "课程地图", description: "从图表基础到支撑阻力的24节中文技术分析课程。" };

export default async function CoursesPage() {
  const modules = await getCourseModules(); const contentCounts = { lessons: modules.flatMap((item) => item.lessons).length, questions: modules.flatMap((item) => item.lessons).reduce((sum, item) => sum + item.quiz.length, 0), cases: 30 };
  return (
    <><SiteHeader /><main id="main-content" className="public-page">
      <section className="page-intro"><div className="shell intro-grid"><div><span className="eyebrow light"><span /> Course map</span><h1>一条从观察到复盘的学习主线</h1><p>四个模块，{contentCounts.lessons} 节短课。先建立描述图表的共同语言，再进入结构判断和历史练习。</p></div><dl><div><dt>{contentCounts.lessons}</dt><dd>节结构化课程</dd></div><div><dt>{contentCounts.questions}</dt><dd>道随堂题</dd></div><div><dt>{contentCounts.cases}</dt><dd>个历史案例</dd></div></dl></div></section>
      <section className="shell course-map section-pad">
        {modules.map((courseModule, moduleIndex) => (
          <article className="course-module-row" key={courseModule.id} style={{ "--module-accent": courseModule.accent } as React.CSSProperties}>
            <header><span>{courseModule.code}</span><h2>{courseModule.title}</h2><p>{courseModule.description}</p><div><span><BookOpen size={16} />{courseModule.lessons.length} 节课</span><span><Clock3 size={16} />约 {courseModule.lessons.reduce((sum, lesson) => sum + lesson.duration, 0)} 分钟</span></div><Link className="button button-outline" href={`/courses/${courseModule.slug}`}>{moduleIndex === 0 ? "免费开始" : "查看模块"} <ArrowRight size={17} /></Link></header>
            <ol>{courseModule.lessons.map((lesson) => <li key={lesson.id}><Link href={`/learn/${courseModule.slug}/${lesson.slug}`}><span>{lesson.number}</span><div><b>{lesson.title}</b><small>{lesson.summary}</small></div>{lesson.free ? <em>免费</em> : <Check size={17} />}</Link></li>)}</ol>
          </article>
        ))}
      </section>
    </main></>
  );
}
