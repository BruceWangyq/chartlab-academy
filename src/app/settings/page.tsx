import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { ProfileForm } from "@/components/profile-form";
import { SiteHeader } from "@/components/site-header";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { getSession } from "@/lib/session";
export const metadata: Metadata = { title: "账户设置", robots: { index: false } };
export default async function SettingsPage() { const session = await getSession(); if (!session) redirect("/login?next=/settings"); const db = getDb(); const [profile] = db ? await db.select().from(profiles).where(eq(profiles.userId, session.id)).limit(1) : []; return <><SiteHeader /><main id="main-content" className="account-page shell"><AccountNav active="/settings" /><header><span>Account</span><h1>账户设置</h1><p>{session.email}</p></header><ProfileForm initial={{ level: profile?.level ?? "beginner", goal: profile?.goal ?? "", weeklyMinutes: profile?.weeklyMinutes ?? 120, marketingConsent: profile?.marketingConsent ?? false, learningReminders: profile?.learningReminders ?? true }} /></main></>; }
