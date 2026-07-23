import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getKnowledgeArticles } from "@/lib/content-source";
import { LibraryCatalog } from "@/components/library-catalog";
export const metadata: Metadata = { title: "知识库", description: "随用随查的中文技术分析概念、框架与复盘方法。" };
export default async function LibraryPage() { const articles = await getKnowledgeArticles(); return <><SiteHeader /><main id="main-content" className="public-page"><section className="page-intro"><div className="shell"><span className="eyebrow light"><span /> Knowledge library</span><h1>先把概念查清楚</h1><p>短小、可搜索、会明确说明条件与局限的技术分析知识库。</p></div></section><div className="shell"><LibraryCatalog articles={articles} /></div></main></>; }
