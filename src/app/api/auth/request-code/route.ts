import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { setOtp } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.email() });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "邮箱地址格式不正确，请检查后重试。" }, { status: 400 });
  const rate = await checkRateLimit(request, "auth-code", 5, 15 * 60_000, parsed.data.email);
  if (!rate.allowed) return NextResponse.json({ error: "请求过于频繁，请稍后再试。" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
  await setOtp({ email: parsed.data.email.toLowerCase(), code });
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: process.env.EMAIL_FROM ?? "ChartLab <login@example.com>", to: parsed.data.email, subject: "你的图表研习社登录验证码", text: `验证码：${code}\n\n10分钟内有效。如非本人操作，请忽略。` });
  }
  return NextResponse.json({ ok: true, demoCode: process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY ? code : undefined });
}
