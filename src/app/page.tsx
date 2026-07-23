import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, FlaskConical, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { StaticMarketChart } from "@/components/static-market-chart";
import { SiteHeader } from "@/components/site-header";
import { getChartCases, getCourseModules } from "@/lib/content-source";

export default async function Home() {
  const [chartCases, modules] = await Promise.all([getChartCases(), getCourseModules()]); const lessons = modules.flatMap((item) => item.lessons); const contentCounts = { lessons: lessons.length, questions: lessons.reduce((sum, item) => sum + item.quiz.length, 0), cases: chartCases.length }; const daily = chartCases[0];
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="hero-section">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <span className="eyebrow"><span /> Learn · Practice · Review</span>
              <h1>从看懂图表开始<span>建立可复用的分析框架。</span></h1>
              <p>系统学习市场结构、价格行为与风险管理；用真实历史片段练习观察、判断与复盘。</p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/courses/chart-foundations">免费开始学习 <ArrowRight size={18} /></Link>
                <Link className="button button-ghost-dark" href="/courses">查看课程地图</Link>
              </div>
              <div className="trust-line"><ShieldCheck size={17} />仅供教育与研究，不提供交易建议或实时信号。</div>
            </div>
            <div className="hero-visual">
              <div className="chart-kicker">历史教学示例 · 隐藏未来走势</div>
              <StaticMarketChart seed={29} height={365} ariaLabel="带有上升趋势、支撑和阻力示意的历史K线图" />
              <span className="chart-label resistance">阻力区域</span><span className="chart-label trend">结构转强</span><span className="chart-label support">支撑区域</span>
              <small>图表为教学用历史模拟片段，不代表未来表现。</small>
            </div>
          </div>
        </section>

        <section className="path-section section-pad">
          <div className="shell">
            <header className="section-heading split-heading">
              <div><span className="eyebrow light"><span /> 清晰的学习路径</span><h2>先建立语言，再训练判断</h2></div>
              <p>每一节课都连接测验和历史案例。看懂不是终点，能够重复完成分析动作才是。</p>
            </header>
            <div className="path-grid">
              <article className="path-item featured"><span className="path-number">01</span><BookOpen aria-hidden="true" /><div><h3>基础入门</h3><p>从价格、K线和时间周期出发，建立观察图表的共同语言。</p><Link href="/courses/chart-foundations">查看路径 <ArrowRight size={16} /></Link></div></article>
              <article className="path-item"><span className="path-number">02</span><SlidersHorizontal aria-hidden="true" /><div><h3>价格行为</h3><p>把K线放回结构和位置，理解推进、回撤与失败信号。</p><Link href="/courses/candlestick-language">查看路径 <ArrowRight size={16} /></Link></div></article>
              <article className="path-item"><span className="path-number">03</span><ShieldCheck aria-hidden="true" /><div><h3>风险意识</h3><p>为每个判断写下反证和失效条件，保护长期学习过程。</p><Link href="/courses/support-resistance">查看路径 <ArrowRight size={16} /></Link></div></article>
            </div>
          </div>
        </section>

        <section className="daily-section section-pad">
          <div className="shell">
            <header className="section-heading inline-heading"><div><span className="eyebrow light"><span /> 今日练习</span><h2>每日历史案例</h2></div><Link href="/cases">查看全部 {contentCounts.cases} 个案例 <ArrowRight size={17} /></Link></header>
            <article className="daily-case">
              <div className="case-chart"><StaticMarketChart seed={daily.seed} height={245} ariaLabel={`${daily.market}历史案例图表`} /></div>
              <div className="case-copy">
                <div className="case-meta"><span>今日案例</span><span>{daily.difficulty}</span></div>
                <h3>{daily.title}</h3><p>{daily.description}</p>
                <ul className="tag-list">{daily.knowledgeTags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                <div className="case-facts"><span><Clock3 size={16} />预计 {daily.duration} 分钟</span><span><FlaskConical size={16} />纸上练习模式</span></div>
              </div>
              <Link className="button button-primary" href={`/practice/${daily.slug}`}>开始练习 <ArrowRight size={18} /></Link>
            </article>
          </div>
        </section>

        <section className="method-section section-pad">
          <div className="shell method-grid">
            <div><span className="eyebrow light"><span /> 为什么这样学</span><h2>把“我感觉”变成<br />可以复盘的证据</h2><p>研习社不会告诉你下一步该买什么。我们只帮助你把观察过程写清楚，并看到自己的判断如何形成。</p></div>
            <ol>
              <li><span>01</span><div><h3>学习概念</h3><p>{contentCounts.lessons} 节短课建立完整框架，每节只处理少量核心概念。</p></div><CheckCircle2 /></li>
              <li><span>02</span><div><h3>立即练习</h3><p>在未知未来走势的历史片段中完成趋势、区域和理由判断。</p></div><CheckCircle2 /></li>
              <li><span>03</span><div><h3>对照复盘</h3><p>查看可解释评分、参考区域与常见误区，保存每次提交快照。</p></div><CheckCircle2 /></li>
            </ol>
          </div>
        </section>

        <section className="quality-section section-pad" aria-labelledby="quality-title">
          <div className="shell"><header className="section-heading split-heading"><div><span className="eyebrow light"><span /> 内容可信度</span><h2 id="quality-title">作者、审核与数据边界都可追溯</h2></div><p>我们不依赖“神奇指标”或收益截图建立信任。每篇内容保留作者、审核人、版本和历史示例来源，发布前按同一套清单复核。</p></header><div className="quality-grid">
            <article><span>01</span><h3>课程作者</h3><p>ChartLab 内容团队把市场结构拆成可观察、可练习、可复盘的动作；正式发布内容会展示具体作者。</p></article>
            <article><span>02</span><h3>独立审核</h3><p>CMS 分离作者与审核人角色，P0 课程、题解、字幕和图表在正式上线前必须完成 100% 内容复核。</p></article>
            <article><span>03</span><h3>历史数据边界</h3><p>案例隐藏未来走势，只评价分析过程；生产数据包必须保留授权与再分发许可，不用模拟数据冒充真实行情。</p></article>
          </div></div>
        </section>

        <section className="course-strip section-pad">
          <div className="shell">
            <header className="section-heading inline-heading"><div><span className="eyebrow light"><span /> 首发课程</span><h2>四个模块，一条完整主线</h2></div><Link href="/courses">浏览全部课程 <ArrowRight size={17} /></Link></header>
            <div className="module-strip">{modules.map((module, index) => (
              <Link className="module-tile" key={module.id} href={`/courses/${module.slug}`} style={{ "--module-accent": module.accent } as React.CSSProperties}>
                <span>{module.code}</span><b>{module.title}</b><small>{module.lessons.length} 节课</small><i>{String(index + 1).padStart(2, "0")}</i>
              </Link>
            ))}</div>
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="shell"><strong>图表研习社</strong><p>用清晰、纪律和复盘建立长期学习能力。</p><span>© 2026 ChartLab Academy · 教育内容不构成投资建议</span></div></footer>
    </>
  );
}
