# 运维 Runbook

## 告警优先级

- P0：登录、练习提交、结账或 Webhook 全面失败；数据损坏；未授权访问。
- P1：关键接口成功率低于 99%、P95 超过 1 秒、视频播放错误超过 3%。
- P2：单页错误、非关键内容或分析事件异常。

## 快速检查

1. 使用监控专用 Bearer Secret 请求 `/api/health`，确认应用与数据库状态。
2. 查看 Vercel Function 日志和最近部署差异。
3. 查看 `webhook_events` 的 `failed` / 重试次数。
4. 查看最近一次 `/api/cron/subscription-reconcile` 的 `evaluated`、`corrected`、`failures` 和对应审计日志，再对照 Stripe Dashboard；不直接手改账单权威数据。
5. 如果只是内容异常，检查 Sanity 发布状态、引用和 revalidate Webhook。

## Webhook 失败

1. 验证 Signing Secret 是否属于当前环境。
2. 查看事件是否已记录；重复事件应安全返回。
3. 修复处理逻辑后从 Stripe 重放事件。
4. 对用户权益执行一次 Stripe → Postgres 对账。

## 订阅对账失败

1. 每日 04:00 UTC 的 `/api/cron/subscription-reconcile` 必须使用 `CRON_SECRET`；未配置 Stripe、数据库或密钥时应明确返回 `503`。
2. `207` 表示部分订阅回查失败：按日志确认 Stripe 限流、网络或权限问题，修复后安全重跑；成功记录已经提交，无需回滚。
3. 核对 `evaluated` 是否等于带 Stripe Subscription ID 的本地镜像总数；任务按 ID 每 100 条分页、每批最多 5 个并发请求。
4. Stripe 返回资源不存在时，本地镜像会标记为 `canceled` 并写入 `subscription.reconciled_missing`；先在 Dashboard 核实该订阅确实被删除。

## 练习提交失败

1. 查看请求是否为 `400`（字段缺失）还是 `500`（服务异常）。
2. 确认案例 rubric 区域上下沿有效且数据包存在。
3. 保留客户端草稿；不要要求用户重新绘制后才排查。

## 恢复演练

每季度：

1. 从 Neon 备份恢复到隔离分支。
2. 验证用户、进度、订阅、练习和审计表数量。
3. 重放一条 Stripe 测试事件并确认幂等。
4. 恢复一份 Sanity 导出。
5. 记录实际 RPO/RTO；MVP 目标 RPO ≤ 24 小时、RTO ≤ 8 小时。

## 隐私与数据保留

1. 每日 `/api/cron/data-retention` 在 `CRON_SECRET` 保护下运行。
2. 删除申请先停止 Stripe 自动续费，30天内原邮箱验证登录可撤回。
3. 30天后删除学习进度、测验、练习、笔记、收藏与偏好，账户邮箱匿名化。
4. 最小账务镜像保留7年；去标识化安全审计保留1年，均由同一任务到期清理。
5. 每季度抽查一次已到期测试账户，确认应用数据库和已配置处理方均按保留策略完成清理。
