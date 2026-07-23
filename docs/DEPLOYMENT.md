# 部署手册

## 1. 生产资源

1. 创建 Neon Postgres，开启自动备份/PITR，保存生产连接串。
2. 创建 Sanity 项目和 production dataset，把 Vercel 域名加入 CORS Origin。
3. 创建 Stripe 月付/年付 Product 与 Price，配置 Customer Portal、税务和 Webhook。
4. 创建 Mux 签名播放 Key；私钥以 Base64 放入环境变量。
5. 在 Resend 验证发件域名；在 Google Cloud 配置 OAuth 回调。
6. 在 Vercel 创建项目，分别配置 Preview/Production 环境变量。
7. 设置至少 32 字符的 `AUTH_SECRET`，并用 `ADMIN_EMAILS` 指定首批运营管理员。
8. 创建 PostHog 与 Sentry 项目，配置 DSN、组织、项目和仅具 Source Map 上传权限的 Token。
9. 分别生成 `CRON_SECRET` 与 `HEALTHCHECK_SECRET`；监控请求用 Bearer Header 访问健康检查，不公开数据库状态。

## 2. 数据库

发布应用前执行：

```bash
pnpm db:migrate
```

迁移必须保持向后兼容：先添加可空字段/新表，再发布读取代码，最后收紧约束。

## 3. Stripe Webhook

生产端点：`https://你的域名/api/stripe/webhook`

至少订阅：

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

把 Signing Secret 写入 `STRIPE_WEBHOOK_SECRET`。用 Stripe CLI 或 Dashboard 重放同一事件，确认数据库只产生一条 `webhook_events`。

## 4. 内容草稿

```bash
pnpm content:export
pnpm sanity dataset import sanity/seed.ndjson production
```

65 份文档均以草稿导入。课程/文章必须指派独立审核人；案例必须把 `licensed-dataset-pending/*` 替换为获授权数据包引用，Schema 才允许发布。

## 5. 发布门禁

```bash
pnpm test:all
pnpm test:coverage
pnpm db:check
pnpm security:audit
pnpm readiness:production
```

`test:all` 会完成类型检查、代码规范、单元/组件测试、生产构建、Lighthouse 和生产服务器浏览器回归。Lighthouse 门禁要求性能 ≥ 90、无障碍 100、最佳实践 ≥ 95、SEO 100，且 LCP < 2.5s、CLS < 0.1、TBT < 200ms。

本地 `test:all` 使用 Lighthouse 默认移动模拟；GitHub 共享运行器使用官方 desktop preset 以减少共享 CPU 抖动，但保持完全相同的分数和 LCP/CLS/TBT 阈值。线上仍以真实用户 Web Vitals P75 作为最终性能权威。

`readiness:production` 会核对正式环境变量、Git 远端和 `config/go-live-approvals.json` 中的真实签字证据。示例文件不得当作签字记录使用。部署完成后执行 `pnpm verify:production -- https://你的正式域名`，自动验证公开路由、法律页、canonical、安全头、robots、sitemap、404 与数据库健康检查。

合并 main 后验证：

- 带 `Authorization: Bearer $HEALTHCHECK_SECRET` 请求 `/api/health` 返回 `200`
- 首页、课程、案例、登录、结账和取消路径
- Sanity 发布后目标页面刷新
- Stripe 测试订阅激活、欠费、取消和恢复
- 用 `Authorization: Bearer $CRON_SECRET` 请求 `/api/cron/subscription-reconcile`，确认返回的 `evaluated` 覆盖全部本地 Stripe 订阅；制造一条测试镜像漂移后确认自动修正并产生 `subscription.reconciled` 审计记录
- Pro 课程/视频无法由免费账户或直接 API 请求绕过；免费账户每自然月 5 个不同案例的额度无法由并发提交绕过
- 进度、笔记、收藏、草稿、评分和账户删除申请均可在数据库核对
- 导出文件覆盖个人学习数据；删除申请停止续费，30天后清理任务完成匿名化，7年后账务镜像清理
- Mux Pro 视频令牌 5 分钟后失效
- sitemap/robots、真实域名 canonical、法律页链接

## 6. 回滚

- 应用：在 Vercel 回滚到上一成功部署。
- 数据库：避免破坏性迁移；必要时从 Neon PITR 恢复到新分支再切换。
- 内容：使用 Sanity 文档历史恢复并重新发布。
- Stripe：账单以 Stripe 为权威；先通过 Webhook 重放恢复本地镜像，仍有漂移时运行全量订阅对账任务。
