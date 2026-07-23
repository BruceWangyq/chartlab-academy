import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { BillingPortalButton } from "@/components/billing-portal-button";
import { SiteHeader } from "@/components/site-header";
import { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
import { getSession } from "@/lib/session";
export const metadata: Metadata = { title: "订阅与账单", robots: { index: false } };
export default async function BillingPage() { const session = await getSession(); if (!session) redirect("/login?next=/billing"); const db = getDb(); const [record] = db ? await db.select().from(subscriptions).where(eq(subscriptions.userId, session.id)).orderBy(desc(subscriptions.updatedAt)).limit(1) : []; return <><SiteHeader /><main id="main-content" className="account-page shell"><AccountNav active="/billing" /><header><span>Billing</span><h1>订阅与账单</h1><p>账单权威数据来自 Stripe；平台只保存用于权益判断的订阅镜像。</p></header><section className="billing-card"><div><span>当前方案</span><strong>{session.plan === "pro" ? "ChartLab Pro" : "免费账户"}</strong><small>{record ? `${record.status} · ${record.planKey}` : "没有有效的 Stripe 订阅记录"}</small></div>{session.plan === "pro" && record?.stripeCustomerId ? <BillingPortalButton /> : <Link className="button button-primary" href="/pricing">查看 Pro 方案</Link>}</section>{record?.periodEnd && <p className="billing-note">当前周期结束：{new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(record.periodEnd)}。取消、付款方式和发票请在 Stripe 门户处理。</p>}</main></>; }
