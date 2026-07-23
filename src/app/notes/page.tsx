import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { PersonalLibrary, type PersonalLibraryItem } from "@/components/personal-library";
import { SiteHeader } from "@/components/site-header";
import { getDb } from "@/db";
import { notes } from "@/db/schema";
import { getCourseModules } from "@/lib/content-source";
import { getSession } from "@/lib/session";
export const metadata: Metadata = { title: "学习笔记", robots: { index: false } };
export default async function NotesPage() {
  const session = await getSession(); if (!session) redirect("/login?next=/notes"); const db = getDb(); const modules = await getCourseModules(); const records = db ? await db.select().from(notes).where(eq(notes.userId, session.id)).orderBy(desc(notes.updatedAt)) : [];
  const items = records.flatMap((record): PersonalLibraryItem[] => { const courseModule = modules.find((item) => item.lessons.some((entry) => entry.id === record.targetId)); const lesson = courseModule?.lessons.find((item) => item.id === record.targetId); if (!lesson || !courseModule) return []; return [{ id: record.id, eyebrow: formatDate(record.updatedAt), title: lesson.title, copy: record.content || "空笔记", href: `/learn/${courseModule.slug}/${lesson.slug}`, action: "返回课程", tags: [courseModule.title, ...lesson.concepts.slice(0, 2)] }]; });
  return <><SiteHeader /><main id="main-content" className="account-page shell"><AccountNav active="/notes" /><header><span>Notes</span><h1>学习笔记</h1><p>跨课程搜索观察、疑问和失效条件，也可按课程与知识标签筛选。</p></header><PersonalLibrary items={items} emptyText="还没有同步到账户的笔记。打开任意课程，在右侧写下第一条笔记。" emptyHref="/courses" /></main></>;
}
function formatDate(value: Date) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(value); }
