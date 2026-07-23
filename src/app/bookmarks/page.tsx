import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { PersonalLibrary, type PersonalLibraryItem } from "@/components/personal-library";
import { SiteHeader } from "@/components/site-header";
import { getDb } from "@/db";
import { bookmarks } from "@/db/schema";
import { getCourseModules } from "@/lib/content-source";
import { getSession } from "@/lib/session";
export const metadata: Metadata = { title: "收藏", robots: { index: false } };
export default async function BookmarksPage() {
  const session = await getSession(); if (!session) redirect("/login?next=/bookmarks"); const db = getDb(); const modules = await getCourseModules(); const records = db ? await db.select().from(bookmarks).where(eq(bookmarks.userId, session.id)).orderBy(desc(bookmarks.createdAt)) : [];
  const items = records.flatMap((record): PersonalLibraryItem[] => { const courseModule = modules.find((item) => item.lessons.some((entry) => entry.id === record.targetId)); const lesson = courseModule?.lessons.find((item) => item.id === record.targetId); if (!lesson || !courseModule) return []; return [{ id: `${record.targetType}-${record.targetId}`, eyebrow: "课程收藏", title: lesson.title, copy: lesson.summary, href: `/learn/${courseModule.slug}/${lesson.slug}`, action: "继续学习", tags: [courseModule.title, ...lesson.concepts.slice(0, 2)] }]; });
  return <><SiteHeader /><main id="main-content" className="account-page shell"><AccountNav active="/bookmarks" /><header><span>Bookmarks</span><h1>收藏内容</h1><p>跨课程搜索需要反复查看的内容，也可按课程与知识标签筛选。</p></header><PersonalLibrary items={items} emptyText="还没有收藏内容。课程标题旁的收藏按钮会把内容同步到这里。" emptyHref="/courses" /></main></>;
}
