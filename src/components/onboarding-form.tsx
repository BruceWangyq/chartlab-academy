"use client";
import { useState } from "react";
import { recommendedLearningPath, type LearningLevel } from "@/lib/onboarding-recommendation";

export function OnboardingForm({ next }: { next: string }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function save(formData?: FormData, useRecommendation = true) {
    setBusy(true); setError("");
    const level = (formData?.get("level") ?? "beginner") as LearningLevel;
    const body = formData ? { level, goal: formData.get("goal"), weeklyMinutes: Number(formData.get("weeklyMinutes")), marketingConsent: false, learningReminders: formData.get("learningReminders") === "on" } : { level, goal: "", weeklyMinutes: 120, marketingConsent: false, learningReminders: true };
    const response = await fetch("/api/me/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) { setBusy(false); setError((await response.json()).error); return; }
    window.location.href = useRecommendation && next === "/dashboard" ? recommendedLearningPath(level) : next;
  }
  return <div className="onboarding-card"><form action={(formData) => save(formData, true)}><fieldset><legend>1. 你现在处于哪个阶段？</legend><div className="onboarding-options"><label><input type="radio" name="level" value="beginner" defaultChecked />刚开始，需要完整路径</label><label><input type="radio" name="level" value="intermediate" />有基础，希望系统练习</label><label><input type="radio" name="level" value="advanced" />已有经验，重视复盘</label></div></fieldset><label>2. 主要学习目标<input name="goal" maxLength={120} placeholder="例如：能独立描述趋势结构和失效条件" /></label><label>3. 每周可投入时间<select name="weeklyMinutes" defaultValue="120"><option value="30">30 分钟</option><option value="60">1 小时</option><option value="120">2 小时</option><option value="240">4 小时以上</option></select></label><label className="checkbox-row"><input type="checkbox" name="learningReminders" defaultChecked />一周未学习时提醒我继续</label><button className="button button-primary" disabled={busy}>{busy ? "正在建立学习路径…" : "查看推荐起点"}</button></form><button className="onboarding-skip" onClick={() => save(undefined, false)} disabled={busy}>暂时跳过</button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
