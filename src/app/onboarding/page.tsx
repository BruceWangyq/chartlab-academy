import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { OnboardingForm } from "@/components/onboarding-form";
import { getSession } from "@/lib/session";
export const metadata: Metadata = { title: "建立学习路径", robots: { index: false } };
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) { const session = await getSession(); if (!session) redirect("/login?next=/onboarding"); const requested = (await searchParams).next; const next = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard"; if (session.onboarded) redirect(next); return <main id="main-content" className="onboarding-page"><Logo /><section><span>60 秒完成</span><h1>从适合你的地方开始</h1><p>只问学习背景和时间，不询问资产、收益目标或交易账户。</p><OnboardingForm next={next} /></section><small>这些信息只用于推荐学习路径，可在设置中随时修改。</small></main>; }
