import Stripe from "stripe";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
import { getSession } from "@/lib/session";
export async function POST(request: Request) { const user = await getSession(); if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 }); const db = getDb(); if (!db || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "账单门户尚未配置。" }, { status: 503 }); const [record] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).orderBy(desc(subscriptions.updatedAt)).limit(1); if (!record?.stripeCustomerId) return NextResponse.json({ error: "没有找到有效的 Stripe 客户记录。" }, { status: 404 }); const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); const portal = await stripe.billingPortal.sessions.create({ customer: record.stripeCustomerId, return_url: `${new URL(request.url).origin}/dashboard` }); return NextResponse.json({ url: portal.url }); }
