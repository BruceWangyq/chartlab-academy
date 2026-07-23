"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Eraser, HelpCircle, Lightbulb, LoaderCircle, MessageSquareText, MousePointer2, Save, Send, SquareDashed, TrendingUp } from "lucide-react";
import { MarketChart } from "@/components/market-chart";
import type { ChartCase } from "@/lib/content";
import type { PracticeScore } from "@/lib/scoring";

type Tool = "pointer" | "trendline" | "zone" | "label";
type Point = { x: number; y: number };
type Annotation = { type: "trendline" | "zone" | "label"; points: Point[]; label?: string };
type Result = { attemptId: string; score: PracticeScore; reference: { trend: "up" | "down" | "range"; support: [number, number]; resistance: [number, number] } };

const trendLabels = { up: "上升", down: "下降", range: "震荡" };
const tools: Array<{ id: Tool | "clear"; label: string; icon: typeof MousePointer2 }> = [
  { id: "pointer", label: "选择", icon: MousePointer2 }, { id: "trendline", label: "趋势线", icon: TrendingUp },
  { id: "zone", label: "水平区域", icon: SquareDashed }, { id: "label", label: "文字标注", icon: MessageSquareText }, { id: "clear", label: "清除全部", icon: Eraser },
];

export function PracticeLab({ chartCase }: { chartCase: ChartCase }) {
  const [tool, setTool] = useState<Tool>("pointer"); const [annotations, setAnnotations] = useState<Annotation[]>([]); const pending = useRef<Point[]>([]);
  const [trend, setTrend] = useState<"up" | "down" | "range">("range"); const [supportLow, setSupportLow] = useState(""); const [supportHigh, setSupportHigh] = useState(""); const [resistanceLow, setResistanceLow] = useState(""); const [resistanceHigh, setResistanceHigh] = useState("");
  const [reasonTags, setReasonTags] = useState<string[]>([]); const [reason, setReason] = useState(""); const [reactionPoints, setReactionPoints] = useState(""); const [status, setStatus] = useState<"idle" | "saving" | "saved" | "submitting">("idle"); const [error, setError] = useState(""); const [result, setResult] = useState<Result>(); const [dirty, setDirty] = useState(false); const [helpOpen, setHelpOpen] = useState(false);
  const helpTriggerRef = useRef<HTMLButtonElement>(null); const helpCloseRef = useRef<HTMLButtonElement>(null);
  const canSubmit = [supportLow, supportHigh, resistanceLow, resistanceHigh].every((value) => Number.isFinite(Number(value)) && value !== "") && reason.length >= 10 && reasonTags.length > 0;
  const parsedReactionPoints = useMemo(() => reactionPoints.split(/[,，\s]+/).map(Number).filter((value) => Number.isFinite(value) && value >= 0 && value <= 100).slice(0, 6), [reactionPoints]);
  const draft = useMemo(() => ({ trend, supportLow, supportHigh, resistanceLow, resistanceHigh, reasonTags, reason, reactionPoints, annotations }), [trend, supportLow, supportHigh, resistanceLow, resistanceHigh, reasonTags, reason, reactionPoints, annotations]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => { try { const saved = JSON.parse(window.localStorage.getItem(`chartlab:draft:${chartCase.id}`) ?? "null"); if (!saved) return; setTrend(saved.trend ?? "range"); setSupportLow(saved.supportLow ?? ""); setSupportHigh(saved.supportHigh ?? ""); setResistanceLow(saved.resistanceLow ?? ""); setResistanceHigh(saved.resistanceHigh ?? ""); setReasonTags(Array.isArray(saved.reasonTags) ? saved.reasonTags : []); setReason(saved.reason ?? ""); setReactionPoints(saved.reactionPoints ?? ""); setAnnotations(Array.isArray(saved.annotations) ? saved.annotations : []); } catch { /* Ignore malformed local drafts. */ } });
    return () => cancelAnimationFrame(frame);
  }, [chartCase.id]);
  useEffect(() => {
    if (!dirty) return;
    window.localStorage.setItem(`chartlab:draft:${chartCase.id}`, JSON.stringify(draft));
    const timer = window.setTimeout(async () => { setStatus("saving"); try { const response = await fetch(`/api/practice/${chartCase.id}/attempts`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) }); setStatus(response.ok ? "saved" : "idle"); } catch { setStatus("idle"); } }, 1500);
    return () => window.clearTimeout(timer);
  }, [chartCase.id, dirty, draft]);
  useEffect(() => { if (!helpOpen) return; const trigger = helpTriggerRef.current; const frame = requestAnimationFrame(() => helpCloseRef.current?.focus()); const containFocus = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); setHelpOpen(false); } else if (event.key === "Tab") { event.preventDefault(); helpCloseRef.current?.focus(); } }; window.addEventListener("keydown", containFocus); return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", containFocus); trigger?.focus(); }; }, [helpOpen]);

  function chooseTool(id: Tool | "clear") { if (id === "clear") { setAnnotations([]); pending.current = []; setDirty(true); } else { setTool(id); pending.current = []; } }
  function chartClick(event: React.MouseEvent<SVGSVGElement>) {
    if (tool === "pointer" || result) return;
    const rect = event.currentTarget.getBoundingClientRect(); const point = { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
    if (tool === "label") { setAnnotations((items) => [...items, { type: "label", points: [point], label: "我的观察" }]); setDirty(true); return; }
    pending.current = [...pending.current, point];
    if (pending.current.length === 2) { const points = pending.current; setAnnotations((items) => [...items, { type: tool, points }]); pending.current = []; setDirty(true); }
  }
  function toggleTag(tag: string) { setReasonTags((items) => items.includes(tag) ? items.filter((item) => item !== tag) : [...items, tag]); setDirty(true); }
  async function saveDraft() {
    setStatus("saving"); window.localStorage.setItem(`chartlab:draft:${chartCase.id}`, JSON.stringify(draft));
    try { const response = await fetch(`/api/practice/${chartCase.id}/attempts`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) }); setStatus(response.ok ? "saved" : "idle"); } catch { setStatus("idle"); }
  }
  async function submit() {
    if (!canSubmit) { setError("请先完成趋势、两个区域、理由标签和至少10个字的说明。"); return; }
    setError(""); setStatus("submitting");
    const response = await fetch(`/api/practice/${chartCase.id}/attempts`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ trend, support: [Number(supportLow), Number(supportHigh)], resistance: [Number(resistanceLow), Number(resistanceHigh)], reactionPoints: parsedReactionPoints, reasonTags, reason, annotations: annotations.map((item) => ({ ...item, points: item.points.flatMap((point) => [point.x, point.y]) })) }) });
    const payload = await response.json(); setStatus("idle");
    if (!response.ok) { setError(payload.error ?? "提交没有完成，请稍后重试。"); return; }
    setResult(payload); setDirty(false); window.localStorage.setItem(`chartlab:attempt:${chartCase.id}:${payload.attemptId}`, JSON.stringify({ ...draft, result: payload }));
  }

  return <><div className="practice-shell">
    <div className="practice-toolbar" aria-label="图表工具">{tools.map(({ id, label, icon: Icon }) => <button className={tool === id ? "active" : ""} onClick={() => chooseTool(id)} key={id} title={label}><Icon /><span>{label}</span></button>)}<button ref={helpTriggerRef} className="help-button" aria-expanded={helpOpen} aria-controls="practice-help-dialog" onClick={() => setHelpOpen(true)}><HelpCircle /><span>如何使用</span></button></div>
    <section className="practice-chart-panel"><header><div><b>{chartCase.market}（日线）</b><span>{chartCase.period}</span></div><span>未来走势已隐藏</span></header><div className={`practice-chart-frame tool-${tool}`}><MarketChart seed={chartCase.seed} height={565} ariaLabel={`${chartCase.market}历史练习图表`} showDataSummary /><svg className="drawing-layer" viewBox="0 0 100 100" preserveAspectRatio="none" onClick={chartClick} aria-label="图表标注层">{annotations.map((annotation, index) => annotation.type === "trendline" ? <line key={index} x1={annotation.points[0].x} y1={annotation.points[0].y} x2={annotation.points[1].x} y2={annotation.points[1].y} vectorEffect="non-scaling-stroke" /> : annotation.type === "zone" ? <rect key={index} x={Math.min(annotation.points[0].x, annotation.points[1].x)} y={Math.min(annotation.points[0].y, annotation.points[1].y)} width={Math.abs(annotation.points[1].x - annotation.points[0].x)} height={Math.max(2, Math.abs(annotation.points[1].y - annotation.points[0].y))} vectorEffect="non-scaling-stroke" /> : <g key={index}><circle cx={annotation.points[0].x} cy={annotation.points[0].y} r="1.2" vectorEffect="non-scaling-stroke" /><text x={annotation.points[0].x + 1.5} y={annotation.points[0].y - 1}>{annotation.label}</text></g>)}</svg>{result && <div className="answer-overlay"><span style={{ top: "24%" }}>参考阻力 {result.reference.resistance.join("–")}</span><span style={{ top: "73%" }}>参考支撑 {result.reference.support.join("–")}</span></div>}</div><footer><span>日线</span><span>100%</span><button onClick={() => { setAnnotations([]); setResult(undefined); }}>重置视图</button></footer></section>
    <aside className="practice-task"><header><BookTaskIcon /><div><h2>任务</h2><p>完成后再查看参考答案。</p></div></header><div className="task-form">
      <fieldset disabled={Boolean(result)}><legend>1. 判断主要趋势</legend><div className="trend-options">{(["up", "down", "range"] as const).map((item) => <label className={trend === item ? "selected" : ""} key={item}><input type="radio" name="trend" value={item} checked={trend === item} onChange={() => { setTrend(item); setDirty(true); }} />{trendLabels[item]}</label>)}</div></fieldset>
      <fieldset disabled={Boolean(result)}><legend>2. 标记支撑区域</legend><div className="range-inputs"><label>下沿<input inputMode="decimal" value={supportLow} onChange={(event) => { setSupportLow(event.target.value); setDirty(true); }} /></label><span>—</span><label>上沿<input inputMode="decimal" value={supportHigh} onChange={(event) => { setSupportHigh(event.target.value); setDirty(true); }} /></label></div></fieldset>
      <fieldset disabled={Boolean(result)}><legend>3. 标记阻力区域</legend><div className="range-inputs"><label>下沿<input inputMode="decimal" value={resistanceLow} onChange={(event) => { setResistanceLow(event.target.value); setDirty(true); }} /></label><span>—</span><label>上沿<input inputMode="decimal" value={resistanceHigh} onChange={(event) => { setResistanceHigh(event.target.value); setDirty(true); }} /></label></div></fieldset>
      <fieldset className="reaction-point-input" disabled={Boolean(result)}><legend>4. 记录关键反应位置（可选加分）</legend><label>图表横向位置，0–100<input aria-label="关键反应位置" inputMode="decimal" value={reactionPoints} onChange={(event) => { setReactionPoints(event.target.value); setDirty(true); }} placeholder="例如 24, 55, 83" /></label><small>可填写最多6个百分比位置，用逗号分隔；键盘输入与图上标注等价。</small></fieldset>
      <fieldset disabled={Boolean(result)}><legend>5. 写下理由</legend><div className="reason-tags">{[["structure", "趋势/结构"], ["volume", "成交量"], ["context", "关键位置"], ["invalidation", "失效条件"]].map(([id, label]) => <label className={reasonTags.includes(id) ? "selected" : ""} key={id}><input type="checkbox" checked={reasonTags.includes(id)} onChange={() => toggleTag(id)} />{label}</label>)}</div><textarea value={reason} onChange={(event) => { setReason(event.target.value); setDirty(true); }} maxLength={600} placeholder="说明你看到了什么，以及什么情况会推翻判断…" /><small>{reason.length} / 600</small></fieldset>
    </div><div className="task-tip"><Lightbulb />结合价格结构、关键高低点和成交量进行分析；先写观察，再写结论。</div>{error && <p className="form-error" role="alert">{error}</p>}
    {result ? <div className="score-card" aria-live="polite"><span>知识点掌握度</span><strong>{result.score.total}<small>/100</small></strong><div><i style={{ width: `${result.score.total}%` }} /></div><dl><div><dt>趋势</dt><dd>{result.score.trend}/40</dd></div><div><dt>价格区域</dt><dd>{result.score.zones}/32</dd></div><div><dt>反应点</dt><dd>{result.score.keyPoints}/8</dd></div><div><dt>理由</dt><dd>{result.score.reasoning}/20</dd></div></dl><ul>{result.score.feedback.map((item) => <li key={item}>{item}</li>)}</ul><Link className="button button-outline" href={relatedCourse(chartCase)}>复习相关课程</Link><button className="button button-outline" onClick={() => setResult(undefined)}>再练一次</button></div> : <div className="task-actions"><button className="button button-outline" onClick={saveDraft}><Save />{status === "saving" ? "正在保存…" : status === "saved" ? "草稿已保存" : "保存草稿"}</button><button className="button button-primary" disabled={!canSubmit || status === "submitting"} onClick={submit}>{status === "submitting" ? <LoaderCircle className="spin" /> : <Send />}提交分析</button></div>}
    </aside>
  </div>{helpOpen && <aside id="practice-help-dialog" className="practice-help" role="dialog" aria-modal="true" aria-labelledby="practice-help-title"><div><h2 id="practice-help-title">完成一次历史案例</h2><ol><li>先观察图表，不打开未来走势。</li><li>选择趋势并填写支撑、阻力价格区域。</li><li>可用绘图工具标注，也可用数字输入关键横向位置。</li><li>写下证据和失效条件；草稿会自动保存在本机与账户。</li><li>提交后输入冻结，先看结构化评分，再看参考区域。</li></ol><button ref={helpCloseRef} className="button button-primary" onClick={() => setHelpOpen(false)}>知道了</button></div></aside>}</>;
}

function BookTaskIcon() { return <span className="task-book" aria-hidden="true">▤</span>; }
function relatedCourse(chartCase: ChartCase) { const tags = chartCase.knowledgeTags.join(""); if (/支撑|阻力|角色/.test(tags)) return "/courses/support-resistance"; if (/趋势|结构/.test(tags)) return "/courses/trend-structure"; if (/K线|假突破/.test(tags)) return "/courses/candlestick-language"; return "/courses/chart-foundations"; }
