import type { Metadata } from "next";
import { CaseCatalog } from "@/components/case-catalog";
import { SiteHeader } from "@/components/site-header";
import { getChartCases } from "@/lib/content-source";

export const metadata: Metadata = { title: "历史案例", description: "在隐藏未来走势的历史K线片段中练习趋势、支撑、阻力与结构复盘。" };
export default async function CasesPage() { const chartCases = await getChartCases(); return <><SiteHeader /><main id="main-content" className="public-page"><section className="page-intro cases-intro"><div className="shell"><span className="eyebrow"><span /> Practice library</span><h1>历史案例练习</h1><p>登录后先完成判断，再查看参考答案。免费用户每个自然月可选择 5 个不同案例，重复练习已选案例不额外占用额度。</p></div></section><section className="shell cases-section section-pad"><CaseCatalog cases={chartCases} /></section></main></>; }
