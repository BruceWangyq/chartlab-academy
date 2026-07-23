"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Search } from "lucide-react";
import type { ChartCase, Difficulty } from "@/lib/content";

export function CaseCatalog({ cases }: { cases: ChartCase[] }) {
  const [difficulty, setDifficulty] = useState<Difficulty | "全部">("全部"); const [query, setQuery] = useState("");
  const filtered = useMemo(() => cases.filter((item) => (difficulty === "全部" || item.difficulty === difficulty) && `${item.title}${item.symbol}${item.knowledgeTags.join("")}`.toLowerCase().includes(query.toLowerCase())), [cases, difficulty, query]);
  return <><div className="case-filters"><label><Search size={18} /><span className="sr-only">搜索案例</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索市场或知识点" /></label><div role="group" aria-label="按难度筛选">{(["全部", "入门", "进阶", "挑战"] as const).map((item) => <button className={difficulty === item ? "active" : ""} onClick={() => setDifficulty(item)} key={item}>{item}</button>)}</div><span>{filtered.length} 个结果</span></div>
    <div className="case-grid">{filtered.map((item) => <article key={item.id}><header><span>{String(item.number).padStart(2, "0")}</span><em>{item.difficulty}</em></header><h2>{item.title}</h2><p>{item.description}</p><ul className="tag-list">{item.knowledgeTags.map((tag) => <li key={tag}>{tag}</li>)}</ul><footer><span><Clock3 size={15} />{item.duration} 分钟</span><Link href={`/practice/${item.slug}`}>开始练习 <ArrowRight size={16} /></Link></footer></article>)}</div>
    {filtered.length === 0 && <div className="empty-state"><h2>没有匹配的案例</h2><p>换一个关键词或清除难度筛选。</p><button onClick={() => { setQuery(""); setDifficulty("全部"); }}>查看全部案例</button></div>}</>;
}
