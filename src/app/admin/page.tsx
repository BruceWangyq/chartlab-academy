import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminEntitlementForm } from "@/components/admin-entitlement-form";
import { SiteHeader } from "@/components/site-header";
import { getDb } from "@/db";
import { auditLogs, subscriptions, users, webhookEvents } from "@/db/schema";
import { getSession, hasAdminAssurance } from "@/lib/session";

export const metadata: Metadata = { title: "运营后台", robots: { index: false } };

export default async function AdminPage() {
  const session = await getSession(); if (!session) redirect("/login"); if (session.role !== "admin") redirect("/dashboard"); if (!hasAdminAssurance(session)) return <><SiteHeader /><main id="main-content" className="admin-page shell"><Link href="/dashboard">← 返回学习中心</Link><h1>需要强认证</h1><div className="admin-empty"><h2>请使用管理员 Google 账户重新登录</h2><p>邮箱验证码可用于普通学习，但运营后台和权限纠错要求更高的登录保证。</p><Link className="button button-primary" href="/api/auth/google?next=/admin">使用 Google 重新登录</Link></div></main></>;
  const db = getDb();
  if (!db) return <><SiteHeader /><main id="main-content" className="admin-page shell"><Link href="/dashboard">← 返回学习中心</Link><h1>运营后台</h1><div className="admin-empty"><h2>等待连接数据库</h2><p>配置 DATABASE_URL 并执行迁移后，这里会显示用户、订阅、Webhook 和操作审计。</p></div></main></>;
  const [recentUsers, recentSubscriptions, recentWebhooks, recentAudits] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)).limit(20), db.select().from(subscriptions).orderBy(desc(subscriptions.updatedAt)).limit(20), db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt)).limit(20), db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(20),
  ]);
  return <><SiteHeader /><main id="main-content" className="admin-page shell"><Link href="/dashboard">← 返回学习中心</Link><header><div><span>Operations</span><h1>运营后台</h1><p>用户、订阅、权益、Webhook 与审计日志。</p></div><dl><div><dt>{recentUsers.length}</dt><dd>最近用户</dd></div><div><dt>{recentSubscriptions.filter((item) => item.status === "active" || item.status === "trialing").length}</dt><dd>有效订阅</dd></div><div><dt>{recentWebhooks.filter((item) => item.status === "failed").length}</dt><dd>失败事件</dd></div></dl></header><section className="admin-card"><h2>手动权益修正</h2><p>所有修改都会写入审计日志。订阅恢复正常后可撤销手动权益。</p><AdminEntitlementForm /></section><AdminTable title="最近用户" headers={["邮箱", "角色", "创建时间"]} rows={recentUsers.map((item) => [item.email, item.role, formatDate(item.createdAt)])} /><AdminTable title="订阅" headers={["方案", "状态", "到期时间"]} rows={recentSubscriptions.map((item) => [item.planKey, item.status, formatDate(item.periodEnd)])} /><AdminTable title="Stripe Webhook" headers={["事件 ID", "状态", "处理时间"]} rows={recentWebhooks.map((item) => [item.eventId, item.status, formatDate(item.processedAt)])} /><AdminTable title="审计日志" headers={["操作", "资源", "时间"]} rows={recentAudits.map((item) => [item.action, item.resource, formatDate(item.createdAt)])} /></main></>;
}

function AdminTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) { return <section className="admin-card"><h2>{title}</h2><div className="admin-table-wrap"><table><thead><tr>{headers.map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={`${title}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>) : <tr><td colSpan={headers.length}>暂无记录</td></tr>}</tbody></table></div></section>; }
function formatDate(value: Date | null) { return value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(value) : "—"; }
