"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

export type PersonalLibraryItem = { id: string; eyebrow: string; title: string; copy: string; href: string; action: string; tags: string[] };

export function PersonalLibrary({ items, emptyText, emptyHref }: { items: PersonalLibraryItem[]; emptyText: string; emptyHref: string }) {
  const [query, setQuery] = useState(""); const [tag, setTag] = useState("全部");
  const tags = useMemo(() => ["全部", ...new Set(items.flatMap((item) => item.tags))], [items]);
  const filtered = useMemo(() => items.filter((item) => (tag === "全部" || item.tags.includes(tag)) && `${item.title}${item.copy}${item.tags.join("")}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query, tag]);
  if (!items.length) return <div className="account-empty"><p>{emptyText}</p><Link className="button button-primary" href={emptyHref}>开始学习</Link></div>;
  return <><div className="personal-library-filters"><label><Search /><span className="sr-only">搜索个人内容</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、内容或标签" /></label><label><span className="sr-only">按标签筛选</span><select value={tag} onChange={(event) => setTag(event.target.value)}>{tags.map((item) => <option key={item}>{item}</option>)}</select></label><span>{filtered.length} 条</span></div><div className="account-list">{filtered.map((item) => <article key={item.id}><small>{item.eyebrow}</small><h2>{item.title}</h2><p>{item.copy}</p><ul className="tag-list">{item.tags.map((itemTag) => <li key={itemTag}>{itemTag}</li>)}</ul><Link href={item.href}>{item.action} →</Link></article>)}</div>{!filtered.length && <div className="account-empty"><p>没有匹配的内容。</p><button onClick={() => { setQuery(""); setTag("全部"); }}>清除筛选</button></div>}</>;
}
