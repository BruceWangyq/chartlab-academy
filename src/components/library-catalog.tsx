"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Search } from "lucide-react";
import type { KnowledgeArticle } from "@/lib/content-source";

export function LibraryCatalog({ articles }: { articles: KnowledgeArticle[] }) {
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("全部"); const categories = ["全部", ...new Set(articles.map((item) => item.category))];
  const filtered = useMemo(() => articles.filter((item) => (category === "全部" || item.category === category) && `${item.title}${item.summary}${item.category}${item.tags.join("")}`.toLowerCase().includes(query.trim().toLowerCase())), [articles, category, query]);
  return <><div className="library-filters"><label><Search /><span className="sr-only">搜索知识库</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索概念、形态或标签" /></label><div role="group" aria-label="按分类筛选">{categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><span>{filtered.length} 篇</span></div><section className="library-grid section-pad">{filtered.map((article, index) => <article key={article.slug}><span>{String(index + 1).padStart(2, "0")}</span><small>{article.category}</small><h2>{article.title}</h2><p>{article.summary}</p><footer><span><Clock3 />{article.read} 分钟阅读</span><Link href={`/library/${article.slug}`}>阅读文章 <ArrowRight /></Link></footer></article>)}</section>{!filtered.length && <div className="empty-state"><h2>没有匹配的文章</h2><p>换一个关键词或查看全部分类。</p><button onClick={() => { setQuery(""); setCategory("全部"); }}>清除筛选</button></div>}</>;
}
