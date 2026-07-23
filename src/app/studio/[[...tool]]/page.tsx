import { redirect } from "next/navigation";
import { SanityStudio } from "@/components/sanity-studio";
import { getSession, hasAdminAssurance } from "@/lib/session";
export const dynamic = "force-dynamic";
export default async function StudioPage() { const user = await getSession(); if (!user) redirect("/login"); if (user.role !== "editor" && user.role !== "admin") return <main style={{ padding: "4rem", fontFamily: "sans-serif" }}><h1>没有内容后台权限</h1><p>请联系管理员将账户角色设为 Editor 或 Admin。</p></main>; if (user.role === "admin" && !hasAdminAssurance(user)) redirect("/api/auth/google?next=/studio"); return <SanityStudio />; }
