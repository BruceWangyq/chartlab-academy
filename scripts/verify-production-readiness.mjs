import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import process from "node:process";

const results = [];
const env = process.env;
const root = new URL("../", import.meta.url);
const approvalsPath = new URL("config/go-live-approvals.json", root);

function add(group, name, passed, remediation) {
  results.push({ group, name, passed: Boolean(passed), remediation });
}

function present(name, minimum = 1) {
  const value = env[name]?.trim() ?? "";
  return value.length >= minimum && !/replace|your-domain|example\.com/i.test(value);
}

function approved(section) {
  return section?.status === "approved" && presentApproval(section);
}

function presentApproval(section) {
  return Boolean(section?.reviewer?.trim() && section?.approvedAt?.trim() && section?.evidence?.trim());
}

let originRemote = "";
try {
  originRemote = execFileSync("git", ["remote", "get-url", "origin"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch { /* Reported below. */ }

add("source", "Git origin remote", /^https?:\/\/|^git@/.test(originRemote), "为项目配置可访问的 Git origin，并确认主分支保护和 CI。 ");
add("core", "HTTPS production URL", /^https:\/\//.test(env.NEXT_PUBLIC_SITE_URL ?? "") && !/localhost|example/i.test(env.NEXT_PUBLIC_SITE_URL ?? ""), "把 NEXT_PUBLIC_SITE_URL 设置为正式 HTTPS 域名。 ");
add("core", "AUTH_SECRET", present("AUTH_SECRET", 32), "生成至少 32 字符、非示例值的 AUTH_SECRET。 ");
add("core", "Production admin", present("ADMIN_EMAILS", 5), "把 ADMIN_EMAILS 设置为真实运营管理员邮箱。 ");
add("core", "Neon/Postgres TLS URL", /^postgres(?:ql)?:\/\//.test(env.DATABASE_URL ?? "") && /sslmode=require/.test(env.DATABASE_URL ?? ""), "设置启用 TLS 的生产 DATABASE_URL，并在 Neon 开启 PITR。 ");
add("core", "Independent cron and health secrets", present("CRON_SECRET", 24) && present("HEALTHCHECK_SECRET", 24) && env.CRON_SECRET !== env.HEALTHCHECK_SECRET, "设置两个不同的高熵 CRON_SECRET 与 HEALTHCHECK_SECRET。 ");

add("email/auth", "Resend sender", present("RESEND_API_KEY", 8) && present("EMAIL_FROM", 8), "配置 Resend API Key 和已验证域名的 EMAIL_FROM。 ");
add("email/auth", "Google OAuth", present("GOOGLE_CLIENT_ID", 8) && present("GOOGLE_CLIENT_SECRET", 8), "配置正式 Google OAuth Client 与生产回调域名。 ");

add("billing", "Stripe live secret", /^sk_live_/.test(env.STRIPE_SECRET_KEY ?? ""), "使用 Stripe 正式模式 secret key。 ");
add("billing", "Stripe signed webhook", /^whsec_/.test(env.STRIPE_WEBHOOK_SECRET ?? ""), "创建生产 Webhook 并配置 Signing Secret。 ");
add("billing", "Distinct Stripe prices", /^price_/.test(env.STRIPE_PRICE_MONTHLY ?? "") && /^price_/.test(env.STRIPE_PRICE_ANNUAL ?? "") && env.STRIPE_PRICE_MONTHLY !== env.STRIPE_PRICE_ANNUAL, "配置不同的月付与年付正式 Price ID。 ");

add("content", "Sanity project and matching public ID", present("SANITY_PROJECT_ID", 2) && env.SANITY_PROJECT_ID === env.NEXT_PUBLIC_SANITY_PROJECT_ID && present("SANITY_DATASET", 2), "配置 Sanity 项目、dataset，并保持服务端/公开 Project ID 一致。 ");
add("content", "Sanity protected access", present("SANITY_API_READ_TOKEN", 8) && present("SANITY_PREVIEW_SECRET", 24) && present("CMS_REVALIDATE_SECRET", 24), "配置最小权限 Sanity Token、预览密钥和刷新密钥。 ");
add("content", "Mux signed playback", present("MUX_SIGNING_KEY_ID", 4) && present("MUX_SIGNING_PRIVATE_KEY", 80), "配置 Mux signed playback Key ID 和 Base64 PKCS#8 私钥。 ");

add("observability", "PostHog", present("POSTHOG_API_KEY", 6) && /^https:\/\//.test(env.POSTHOG_HOST ?? ""), "配置生产 PostHog 项目与 HTTPS Host。 ");
add("observability", "Sentry runtime and source maps", present("SENTRY_DSN", 8) && present("NEXT_PUBLIC_SENTRY_DSN", 8) && present("SENTRY_ORG", 2) && present("SENTRY_PROJECT", 2) && present("SENTRY_AUTH_TOKEN", 8), "配置生产 Sentry DSN、组织、项目和 Source Map 上传 Token。 ");

let approvals;
if (existsSync(approvalsPath)) {
  try { approvals = JSON.parse(readFileSync(approvalsPath, "utf8")); } catch { approvals = null; }
}
add("approval", "Go-live approval manifest", Boolean(approvals), "复制 config/go-live-approvals.example.json 为 config/go-live-approvals.json，并记录真实签字和证据。 ");
if (approvals) {
  add("approval", "Brand/domain approval", approved(approvals.brand), "记录品牌、域名和商标初查负责人、日期及证据。 ");
  add("approval", "Legal approval", approved(approvals.legal) && approvals.legal.jurisdictions?.length > 0, "由合资格顾问确认销售地区、条款、隐私、退款、续费和税务。 ");
  add("approval", "P0 content QA", approved(approvals.content) && approvals.content.reviewedLessons >= 24 && approvals.content.reviewedQuestions >= 60 && approvals.content.reviewedCases >= 30, "完成至少 24 节课、60 题、30 案例的独立内容复核。 ");
  add("approval", "Market data licenses", approved(approvals.marketData) && approvals.marketData.licensedCases >= 30, "归档 30 个案例的数据展示、缓存和再分发许可。 ");
  add("approval", "Real-device QA", approved(approvals.devices) && approvals.devices.iphone && approvals.devices.android && approvals.devices.safari, "在真实 iPhone、Android 和 Safari 完成键盘、触控、字幕及弱网检查。 ");
  add("approval", "Operations readiness", approved(approvals.operations) && /@/.test(approvals.operations.supportEmail ?? "") && /^https:\/\//.test(approvals.operations.statusPageUrl ?? "") && approvals.operations.supportSla?.trim() && approvals.operations.softLaunchPlan?.trim(), "记录客服邮箱、状态页、支持 SLA、软启动名单和首周复盘安排。 ");
}

const groups = [...new Set(results.map((item) => item.group))];
for (const group of groups) {
  console.log(`\n${group.toUpperCase()}`);
  for (const item of results.filter((entry) => entry.group === group)) console.log(`${item.passed ? "PASS" : "FAIL"}  ${item.name}`);
}

const failures = results.filter((item) => !item.passed);
console.log(`\nProduction readiness: ${results.length - failures.length}/${results.length} checks passed.`);
if (failures.length) {
  console.log("\nRequired actions:");
  failures.forEach((item, index) => console.log(`${index + 1}. ${item.remediation.trim()}`));
  process.exitCode = 1;
} else {
  console.log("Configuration and recorded approvals are ready. Run pnpm verify:production after deployment.");
}
