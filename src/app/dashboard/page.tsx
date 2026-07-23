import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardProgress } from "@/components/dashboard-progress";
import { LogoutButton } from "@/components/logout-button";
import { SiteHeader } from "@/components/site-header";
import { AccountNav } from "@/components/account-nav";
import { getSession } from "@/lib/session";
import { getChartCases, getCourseModules } from "@/lib/content-source";

export const metadata: Metadata = { title: "学习中心", robots: { index: false } };
export default async function DashboardPage() { const session = await getSession(); if (!session) redirect("/login"); if (!session.onboarded) redirect("/onboarding?next=/dashboard"); const [modules, chartCases] = await Promise.all([getCourseModules(), getChartCases()]); return <><SiteHeader /><main id="main-content" className="dashboard-page"><header className="dashboard-header shell"><div><span>学习中心</span><h1>欢迎回来</h1><p>{session.email} · {session.plan === "pro" ? "Pro 会员" : "免费账户"}</p>{session.role === "admin" && <a href="/admin">进入运营后台 →</a>}</div><LogoutButton /></header><div className="shell dashboard-content"><AccountNav active="/dashboard" /><DashboardProgress modules={modules} chartCases={chartCases} accountSync={Boolean(process.env.DATABASE_URL)} /></div></main></>; }
