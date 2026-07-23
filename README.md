# 图表研习社 · ChartLab Academy

中文技术分析教育与历史图表练习平台。产品闭环是 **学习 → 练习 → 复盘**，明确不提供实时交易信号、下单、跟单或收益承诺。

## 已实现的 MVP

- 公开站：首页、课程地图、4 个模块、知识库、30 个历史案例、定价、关于与法律页面
- 学习系统：24 节课、72 道题（每课含历史图表判断题）、三问引导后的分层起点推荐、服务端进度/收藏/笔记/测验、离线降级与下一步推荐
- 图表实验室：Lightweight Charts 5、趋势/区域/关键点/文字标注、即时本地与防抖云端草稿、服务端规则评分、参考答案和重练；免费账户每月 5 个不同案例
- 账户：邮箱一次性验证码、Google OAuth、签名 HttpOnly 会话、学习连续天数/周目标/成就、复盘/笔记/收藏/账单/设置、数据导出与可撤回删除申请
- 订阅：Stripe 固定 Price ID Checkout、Customer Portal、签名 Webhook、幂等事件表、订阅镜像和每日 Stripe → Postgres 全量分页对账
- 内容与视频：Sanity Schema/Studio/草稿预览/定向刷新、带替代文字的正文图片、65 份仅草稿导入包、Mux HLS 与短时签名播放令牌
- 运营与平台：用户/订阅/Webhook/审计后台、手动权益修正、访问控制、频率限制、Postgres/Drizzle 14 表、健康检查、安全头与 SEO
- 隐私与质量：分析同意控制、账户导出、30 天删除/匿名化与保留任务；Vitest、Chromium/WebKit/移动 Chrome、完整 WCAG 2.2 A/AA、44px 触控目标、200% 缩放、180 KB 初始 JS 预算、Lighthouse 门禁、SRI、Sentry/PostHog

## 本地启动

需要 Node.js 22+ 和 pnpm。

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

打开 `http://localhost:3000`。未配置 Resend 时，邮箱验证码会直接显示在登录页，仅用于本地演示。

## 验证命令

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm audit:lighthouse
pnpm test:e2e:built
pnpm security:audit
```

完整发布前验收可直接执行 `pnpm test:all`；它会依次完成静态检查、单元/组件测试、生产构建、Lighthouse 和三种浏览器配置的 E2E 回归。

正式上线前还必须执行：

```bash
pnpm readiness:production
pnpm verify:production -- https://你的正式域名
```

第一条会验证生产配置与带证据的人工审批单，但不会打印任何密钥；第二条在部署后验证 HTTPS、核心路由、法律页、canonical、安全响应头、SEO 文件、404 和受保护健康检查。

数据库：

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

内容草稿：

```bash
pnpm content:export
pnpm sanity dataset import sanity/seed.ndjson production
```

导入文件全部使用 `drafts.*` ID，不会绕过审核直接公开。请在 Studio 中补齐真实作者、独立审核人、视频字幕和获授权数据包后再发布。

## 外部服务

复制 `.env.example` 后配置：

- Neon/Postgres：`DATABASE_URL`
- Stripe：secret、webhook secret、月付/年付固定 Price ID
- Sanity：项目 ID、dataset、刷新密钥
- Mux：签名 Key ID 与 Base64 编码的 PKCS#8 私钥
- Resend：API Key 与已验证发件域名
- Google OAuth：Client ID/Secret，回调地址 `/api/auth/google/callback`
- PostHog/Sentry：产品事件、Web Vitals、错误监控和 Source Map 上传

生产健康检查还需单独配置 `HEALTHCHECK_SECRET`；数据保留和提醒任务使用 `CRON_SECRET`，两者不要复用。分析默认使用 `required` 同意模式，可按目标地区改为 `not_required` 或完全 `disabled`。

`ADMIN_EMAILS` 接受逗号分隔的运营管理员邮箱。管理员首次登录时会获得运营后台权限；生产 `AUTH_SECRET` 少于 32 字符时应用会拒绝建立会话。

没有凭据时，本地核心学习和练习闭环仍可运行；需要外部服务的接口会返回明确的 `503`，不会伪造成功。

更多资料：

- [架构说明](docs/ARCHITECTURE.md)
- [部署手册](docs/DEPLOYMENT.md)
- [正式上线交付单](docs/PRODUCTION-HANDOFF.md)
- [运维 Runbook](docs/RUNBOOK.md)
- [MVP 验收清单](docs/ACCEPTANCE.md)
