import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { legalDocuments } from "@/lib/legal";
type LegalSlug = keyof typeof legalDocuments;
export function generateStaticParams() { return Object.keys(legalDocuments).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const document = legalDocuments[(await params).slug as LegalSlug]; return document ? { title: document.title, robots: { index: true, follow: true } } : {}; }
export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) { const document = legalDocuments[(await params).slug as LegalSlug]; if (!document) notFound(); return <><SiteHeader /><main id="main-content" className="legal-page"><header><div className="shell"><Link href="/">← 返回首页</Link><h1>{document.title}</h1><p>最后更新：{document.updated}</p></div></header><article>{document.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}</article><nav><Link href="/legal/terms">服务条款</Link><Link href="/legal/privacy">隐私政策</Link><Link href="/legal/refund">取消与退款</Link><Link href="/legal/disclaimer">教育免责声明</Link></nav></main></>; }
