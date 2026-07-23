import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileText, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { PracticeLab } from "@/components/practice-lab";
import { getChartCase, getChartCases } from "@/lib/content-source";
import { getSession } from "@/lib/session";
import { canAccessCase } from "@/lib/access";

export async function generateStaticParams() { return (await getChartCases()).map((chartCase) => ({ case: chartCase.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ case: string }> }): Promise<Metadata> { const chartCase = await getChartCase((await params).case); return chartCase ? { title: chartCase.title, description: chartCase.description, robots: { index: false, follow: false } } : {}; }
export default async function PracticePage({ params }: { params: Promise<{ case: string }> }) { const route = await params; const [chartCase, chartCases] = await Promise.all([getChartCase(route.case), getChartCases()]); if (!chartCase) notFound(); const session = await getSession(); const access = await canAccessCase(chartCase, session); if (!access.allowed && access.reason === "login") redirect(`/login?next=/practice/${route.case}`); if (!access.allowed) redirect(`/pricing?from=/practice/${route.case}&limit=cases`); return <><header className="practice-header"><Logo compact /><Link href="/cases"><b>历史案例练习</b><span>{chartCase.number} / {chartCases.length}</span></Link><div><span><FileText />纸上练习模式</span><small><ShieldCheck />仅用于历史学习与技能提升，不构成投资建议。</small></div></header><main id="main-content" className="practice-page"><PracticeLab chartCase={chartCase} /><div className="practice-answer-lock">提交后解锁参考区域与结构化评分</div></main></>; }
