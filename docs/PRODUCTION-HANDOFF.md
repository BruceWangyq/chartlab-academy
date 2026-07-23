# 正式上线交付单

本文件把 PRD 的 Go-live 清单转成可执行门禁。任何环境变量、人工签字或线上结果缺失时，都不得把 Preview 或本地 RC 标记为 Production。

## 1. 生产资源与签字

1. 复制 `.env.example` 为 `.env.local`，填入生产域名、Neon、Stripe、Sanity、Mux、Resend、Google、PostHog 和 Sentry 配置。
2. 复制 `config/go-live-approvals.example.json` 为 `config/go-live-approvals.json`。
3. 由实际负责人记录品牌/域名、法律、内容、行情许可、真实设备和运营准备的审核人、日期与证据链接。
4. 执行 `pnpm readiness:production`；所有项目必须为 `PASS`。命令只显示检查名称，不打印密钥值。

审批证据不得只是“已确认”文本：内容 QA 应指向复核记录，行情应指向许可或采购记录，设备 QA 应指向测试记录，法律应指向目标销售地区的审阅版本。

## 2. 发布前自动门禁

```bash
pnpm install --frozen-lockfile
pnpm test:all
pnpm test:coverage
pnpm db:check
pnpm security:audit
pnpm content:export
pnpm readiness:production
```

随后在 Preview/Staging 完成数据库迁移、Sanity 草稿导入、Mux 播放、Stripe 测试模式订阅/取消/Webhook 重放，以及真实设备检查。生产发布前必须保存恢复演练的 RPO/RTO 记录。

## 3. 发布后自动冒烟

```bash
pnpm verify:production -- https://你的正式域名
```

该命令验证公开核心路由、法律页、HTTPS canonical、CSP、安全头、robots、sitemap、未知路由 404 和携带 `HEALTHCHECK_SECRET` 的数据库健康检查。

## 4. 必须人工完成的交易与内容流程

- Stripe：正式 Checkout、税费展示、Portal、周期末取消、欠费宽限、恢复、退款和同一 Webhook 重放。
- Sanity：24 节课、至少 60 题、30 案例全部由非作者审核；确认待授权数据引用已替换。
- Mux：24 节视频、字幕、文字稿、签名播放和来源域名限制。
- 运营：客服邮箱、状态页、支持 SLA、软启动名单、反馈表及首周每日复盘安排。
- 数据与恢复：Neon PITR、Sanity 导出、行情数据版本记录、应用回滚和数据库恢复演练。

完成上述项目并保存证据后，才能把 `docs/ACCEPTANCE.md` 的结论从“本地 Release Candidate”改为“正式 Go-live 已验证”。
