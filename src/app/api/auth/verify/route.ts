import { NextResponse } from "next/server";
import { z } from "zod";
import { clearOtp, createSessionForEmail, getOtp, setOtp } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.email(), code: z.string().regex(/^\d{6}$/), next: z.string().optional() });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "请输入邮箱和6位验证码。" }, { status: 400 });
  const rate = await checkRateLimit(request, "auth-verify", 8, 15 * 60_000, parsed.data.email);
  if (!rate.allowed) return NextResponse.json({ error: "验证失败次数过多，请重新获取验证码。" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const otp = await getOtp();
  if (!otp || otp.email !== parsed.data.email.toLowerCase()) return NextResponse.json({ error: "验证码不正确或已过期，请重新获取。" }, { status: 401 });
  if (otp.code !== parsed.data.code) {
    const attempts = (otp.attempts ?? 0) + 1;
    if (attempts >= 3) { await clearOtp(); return NextResponse.json({ error: "验证码错误次数过多，请重新获取验证码。" }, { status: 401 }); }
    await setOtp({ email: otp.email, code: otp.code, attempts }, otp.exp);
    return NextResponse.json({ error: "验证码不正确，请重试。" }, { status: 401 });
  }
  const user = await createSessionForEmail(otp.email);
  await clearOtp();
  const redirectTo = parsed.data.next?.startsWith("/") && !parsed.data.next.startsWith("//") ? parsed.data.next : "/dashboard";
  return NextResponse.json({ ok: true, redirectTo: user.onboarded ? redirectTo : `/onboarding?next=${encodeURIComponent(redirectTo)}` });
}
