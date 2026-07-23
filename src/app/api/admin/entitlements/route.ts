import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { auditLogs, entitlements, users } from "@/db/schema";
import { getSession, hasAdminAssurance } from "@/lib/session";

const schema = z.object({ email: z.email(), active: z.boolean(), expiresAt: z.string().datetime({ local: true }).nullable() });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  if (!hasAdminAssurance(session)) return NextResponse.json({ error: "运营后台需要管理员通过 Google 强认证登录。" }, { status: 403 });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "请检查邮箱和到期时间。" }, { status: 400 });
  const db = getDb(); if (!db) return NextResponse.json({ error: "尚未连接生产数据库。" }, { status: 503 });
  const [target] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
  if (!target) return NextResponse.json({ error: "没有找到这个用户。" }, { status: 404 });
  if (parsed.data.active) await db.insert(entitlements).values({ userId: target.id, key: "pro", source: `admin:${session.id}`, expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null }).onConflictDoUpdate({ target: [entitlements.userId, entitlements.key], set: { source: `admin:${session.id}`, expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null } });
  else await db.delete(entitlements).where(and(eq(entitlements.userId, target.id), eq(entitlements.key, "pro")));
  await db.insert(auditLogs).values({ actorId: session.id, action: parsed.data.active ? "entitlement.grant" : "entitlement.revoke", resource: `user:${target.id}`, metadata: { email: target.email, expiresAt: parsed.data.expiresAt } });
  return NextResponse.json({ message: parsed.data.active ? "Pro 权益已开通。" : "手动权益已撤销。" });
}
