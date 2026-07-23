import "server-only";
import { Resend } from "resend";

type EmailKind = "welcome" | "subscription_active" | "subscription_cancelled" | "payment_failed" | "learning_reminder" | "account_deletion_requested";
const content: Record<EmailKind, { subject: string; text: string }> = {
  welcome: { subject: "欢迎来到图表研习社", text: "你的学习账户已经建立。建议从第一模块开始：先记录图表事实，再写判断和失效条件。" },
  subscription_active: { subject: "ChartLab Pro 已激活", text: "你的 Pro 权益已经激活。课程、案例和完整复盘历史现已开放。账单与取消可随时在客户门户管理。" },
  subscription_cancelled: { subject: "ChartLab Pro 取消确认", text: "你的订阅已取消。权益会按 Stripe 显示的当前周期结束时间保留；学习进度、笔记和练习记录不会删除。" },
  payment_failed: { subject: "ChartLab Pro 付款需要处理", text: "最近一次续费没有成功。平台会在宽限期内保留 Pro 权益，请前往客户门户更新付款方式。" },
  learning_reminder: { subject: "继续你的图表学习计划", text: "你还有未完成的课程。回到学习中心继续上一节，完成一次短练习也算有效进步。你可以在账户设置中关闭学习提醒。" },
  account_deletion_requested: { subject: "账户删除申请已受理", text: "你的账户已退出，订阅自动续费已停止。学习与个人内容将在30天后删除或匿名化；依法需要的账务记录和限期安全审计记录除外。30天内使用原邮箱重新登录可撤回申请。" },
};

export async function sendTransactionalEmail(to: string, kind: EmailKind) {
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: "not_configured" as const };
  const resend = new Resend(process.env.RESEND_API_KEY); const message = content[kind];
  await resend.emails.send({ from: process.env.EMAIL_FROM ?? "ChartLab <login@example.com>", to, subject: message.subject, text: `${message.text}\n\n${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}` });
  return { sent: true };
}
