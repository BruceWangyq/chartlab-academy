# PRD v1.0 验收证据矩阵

最后更新：2026-07-22。结论：**本地 Release Candidate 已通过；尚未满足正式 Go-live 条件。**

## 已由自动化验证

- [x] 4 模块 / 24 节课 / 72 题 / 30 案例；每课3题且至少1道为隐藏未来走势的历史图表判断题，稳定 ID 与路由唯一。
- [x] 首页 → 课程 → 小节 → 测验，以及案例提交 → 可解释评分 → 复盘闭环。
- [x] 每课含目标、最多 3 个核心概念、历史片段推演、2 个误区、测验、即时案例与知识卡。
- [x] 邮箱 OTP（成功后立即销毁，重放被拒绝）、Google OAuth（签名 state 且消费后清除）、首次登录三问引导；默认进入按水平推荐的起点，受保护原目标页面仍优先返回。
- [x] Learner / Editor / Admin 路由隔离；Admin 强认证与关键操作审计。
- [x] 服务端课程、案例、视频与 API 权限；可选顺序解锁。
- [x] 免费层：M01、每月 5 个唯一案例、20 条笔记、20 条收藏、最近 7 天复盘。
- [x] Stripe 固定价格映射、Checkout、Portal、Webhook 验签/幂等、付款成功/失败、取消与 5 天宽限期模型；每日全量分页对账可修正漏收事件造成的本地镜像漂移。
- [x] 课程进度、视频秒数、笔记、收藏、草稿、评分与设置的 Postgres 路径；5 份可顺序执行的 Drizzle 迁移。
- [x] 练习草稿浏览器即时保存、1.5 秒服务端防抖保存；提交后答案冻结，可主动重新练习。
- [x] 评分由趋势 40、关键区域 32、关键反应点 8、理由 20 组成，并返回逐项解释和关联课程。
- [x] 账户 JSON 导出、停止 Stripe 续费后申请删除、30 天撤回、匿名化及 7 年账务/1 年安全审计保留策略。
- [x] 分析同意模式、拒绝后无匿名/会话标识符、设置页可改选择；服务端产品事件同样遵守同意状态。
- [x] 自然周目标、当前/最长连续学习、首课/首测验/首练习/M01/周目标成就和跨课程下一步推荐。
- [x] 笔记与收藏跨课程搜索/标签筛选；复盘显示错题解析、最弱评分维度和真实推荐案例。
- [x] 欢迎、订阅激活、取消、付款失败与 7 天未学习提醒模板及定时任务。
- [x] Sanity 课程/小节/案例/文章/作者 Schema，草稿预览、版本、作者/审核人、定向刷新及 65 份仅草稿导入包。
- [x] Sanity 发布校验阻止缺少审核人、正文、题解或仍引用待授权数据包的内容。
- [x] PostHog 产品事件与 Web Vitals，包含用户/匿名/会话/时间/语言/设备上下文和真实练习次数；Sentry 服务端/客户端延迟加载、Source Map 上传配置。
- [x] Course / Article JSON-LD、canonical、sitemap、robots、知识库搜索与分类。
- [x] 图表替代说明、最近 10 根 K 线数据表、非拖拽数字输入、屏幕阅读器错误、键盘提交；Sanity 正文图片按必填替代文字渲染。
- [x] 11 个代表性公开/账户页面在 Chromium、WebKit、移动 Chrome 通过完整 WCAG 2.2 A/AA axe 扫描；练习帮助弹窗首焦点、Tab 约束、Escape 关闭和触发点恢复通过。
- [x] Chromium 与 WebKit 的 200% 缩放；Chromium、WebKit、移动 Chrome 核心流程和窄屏无溢出；移动 Chrome 主要控件均达到至少 44px 触控目标。
- [x] 首页初始压缩 JavaScript 小于 180 KB；首页使用服务端静态 SVG 行情示意，交互图表库仅在学习/练习场景按需加载。
- [x] 本地生产构建 Lighthouse：性能 99、无障碍 100、最佳实践 100、SEO 100；LCP 2098ms、CLS 0.000、TBT 44ms。
- [x] CSP、安全响应头、构建期 SRI、登录/结账/练习/Webhook 独立限流。
- [x] 依赖已知漏洞为 0；CI 包含 audit、CodeQL、Gitleaks、Dependabot。
- [x] CI 发布门禁包含核心分支覆盖阈值、Drizzle Schema 检查、生产构建、Lighthouse、Chromium/WebKit/移动 Chrome E2E，并上传质量报告。
- [x] 生产就绪预检会逐项验证正式环境、Git 远端和带证据人工审批；部署后冒烟脚本覆盖 HTTPS 核心路由、法律页、canonical、安全头、SEO 文件、404 与受保护健康检查。
- [x] 生产构建 111 个页面；15 个单元/组件测试文件共 38 项通过，覆盖导航、测验、付费墙和绘图工具；语句覆盖率 99.29%、分支 85.21%、函数 100%、行 100%。
- [x] Playwright 54 项：Chromium、WebKit、移动 Chrome 共 50 通过，4 项按浏览器/设备能力跳过；无失败。

验证命令：

```bash
pnpm test:all
pnpm test:coverage
pnpm exec drizzle-kit check
pnpm security:audit
pnpm content:export
pnpm readiness:production
```

## 仍需真实资源和人工签字

当前工作区只有示例环境变量且没有可用 Git 远端，以下事项无法在本地代码内伪造为已完成：

当前 `pnpm readiness:production` 的权威结果为 **0/17**：没有 `.env.local`、Git origin 或 `config/go-live-approvals.json`。完成外部配置后必须以该命令全绿和部署后的 `pnpm verify:production` 全绿替代这一记录。

- [ ] Neon 生产迁移、备份/PITR、恢复演练和 RPO/RTO 记录。
- [ ] Resend 域名、真实送达/退信；Google OAuth 正式回调域名。
- [ ] Sanity 项目导入草稿；为内容指派真实作者与独立审核人并完成 P0 100% 复核。
- [ ] 24 节视频的 Mux 资产、signed playback、字幕、文字稿和播放域名限制。
- [ ] 30 个案例替换为获授权历史 OHLCV 数据包并归档再分发许可。
- [ ] Stripe 测试与正式模式的支付、Tax、退款、取消、欠费恢复和 Webhook 重放。
- [ ] Sentry/PostHog/Vercel Log Drain 的生产项目、Source Map 上传、阈值告警、状态页与客服邮箱。
- [ ] 真实 iPhone、Android、Safari 设备的键盘、触控、字幕与弱网恢复检查。
- [ ] 目标销售地区的条款、隐私、退款、自动续费和税务法律审核。
- [ ] 若合规要求禁止任何 `script-src 'unsafe-inline'`，需接受全站动态渲染成本并迁移到逐请求 nonce CSP；当前方案使用 CSP + 构建期 SRI，以保留静态页面与性能预算。

上述项目完成前，产品可以作为本地或受限 Preview 验收，但不能宣称正式上线。
