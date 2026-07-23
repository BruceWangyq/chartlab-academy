import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, BookOpen, FlaskConical, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "登录", description: "登录图表研习社，保存课程进度、笔记和历史练习。", robots: { index: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) { const requested = (await searchParams).next; const next = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard"; return <main id="main-content" className="login-page"><section className="login-brand-panel"><Logo /><div><span className="eyebrow"><span /> ChartLab Academy</span><h1>把每一次判断<br />留给未来复盘。</h1><p>保存课程进度、图表练习和笔记，在同一条学习主线上持续前进。</p><ul><li><BookOpen />课程进度可靠保存</li><li><FlaskConical />每次练习保留快照</li><li><BarChart3 />只评价知识点掌握</li></ul></div><small><ShieldCheck />不接入券商，不提供交易信号。</small></section><section className="login-panel"><div><Link className="login-back" href="/">← 返回首页</Link><h2>登录或创建账户</h2><p>无需密码。我们会向你的邮箱发送一次性验证码。</p><LoginForm next={next} /></div></section></main>; }
