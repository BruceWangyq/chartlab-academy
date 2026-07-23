import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { CheckoutButton } from "@/components/checkout-button";
import { SiteHeader } from "@/components/site-header";
export const metadata: Metadata = { title: "定价", description: "免费体验完整学习闭环，Pro解锁全部课程、案例和复盘历史。" };
const rows = [["基础课程", "M01完整", "全部"], ["历史案例", "每月5个", "不限量"], ["测验与进度", "基础", "完整"], ["复盘中心", "最近7天", "全部历史"], ["笔记与收藏", "各20条", "不限量"], ["新内容", "部分", "全部"]];
const contexts = {
  course: { title: "你已经完成免费模块", copy: "已保存的课程进度不会消失。Pro 解锁其余18节课程、关联案例和完整复盘。" },
  cases: { title: "本月已体验5个不同案例", copy: "已选案例仍可重复练习。Pro 解锁不限量案例，不会删除现有评分与快照。" },
  review: { title: "最近7天的复盘仍可继续使用", copy: "Pro 解锁全部历史、薄弱项趋势和长期错题复习。" },
  personal: { title: "已保存20条个人内容", copy: "已有笔记与收藏会继续保留。Pro 解锁不限量个人知识资产。" },
} as const;
export default async function PricingPage({ searchParams }: { searchParams: Promise<{ limit?: string }> }) {
  const limit = (await searchParams).limit as keyof typeof contexts | undefined; const context = limit ? contexts[limit] : undefined;
  return <><SiteHeader /><main id="main-content" className="pricing-page"><section className="page-intro"><div className="shell"><span className="eyebrow light"><span /> Simple pricing</span><h1>先免费学完一个模块</h1><p>免费层包含完整的学习—测验—练习闭环。Pro出售的是内容深度、练习数量和长期复盘效率。</p></div></section>{context && <section className="shell paywall-context" role="status"><div><span>你已获得的价值</span><h2>{context.title}</h2><p>{context.copy}</p></div><Link href="/courses/chart-foundations">继续免费路径</Link></section>}<section className="shell pricing-grid section-pad"><article><span>Free</span><h2>免费</h2><strong>US$0</strong><p>完整体验第一模块和每月5个历史案例。</p><Link className="button button-outline" href="/courses/chart-foundations">免费开始学习</Link></article><article className="featured"><span>Pro · 推荐</span><h2>月付</h2><strong>US$19<small>/月</small></strong><p>适合希望持续学习、反复练习和长期复盘的用户。</p><CheckoutButton plan="monthly" label="选择 Pro 月付" /></article><article><span>Pro · 最省</span><h2>年付</h2><strong>US$149<small>/年</small></strong><p>按月折合约 US$12.42，可随时取消自动续费。</p><CheckoutButton plan="annual" label="选择 Pro 年付" /></article></section><p className="shell pricing-terms">月付和年付均会自动续费，直至你在客户门户取消；取消后权益保留到当前周期结束。结账前会显示适用税费和最终总价。继续订阅即表示同意<Link href="/legal/terms">服务条款</Link>、<Link href="/legal/refund">退款政策</Link>与<Link href="/legal/privacy">隐私政策</Link>。关闭结账后仍可继续使用免费课程与额度。</p><section className="shell pricing-table"><header><h2>权益对比</h2><span>没有隐藏功能，也不出售交易信号。</span></header>{rows.map(([label, free, pro]) => <div key={label}><b>{label}</b><span>{free === "部分" ? <Minus /> : <Check />}{free}</span><span><Check />{pro}</span></div>)}</section><section className="shell pricing-note"><h2>取消应该和订阅一样简单</h2><p>可在客户门户自助取消，默认在当前计费周期结束时生效。付款失败时提供5天宽限期；降级不会删除课程进度、笔记或练习历史。</p></section></main></>;
}
