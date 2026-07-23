"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Award, Bookmark, CheckCircle2, FileText, Flame, FlaskConical } from "lucide-react";
import type { ChartCase, CourseModule } from "@/lib/content";
import { earnedAchievements, learningStreak, startOfUtcWeek, type AchievementId } from "@/lib/learning-habits";

type Progress = { complete: number; completedLessonIds: string[]; notes: number; attempts: number; quizzes: number; bookmarks: number; weeklyLessonIds: string[]; weeklyAttempts: number; weeklyGoal: number; currentStreak: number; longestStreak: number };
const initialProgress: Progress = { complete: 0, completedLessonIds: [], notes: 0, attempts: 0, quizzes: 0, bookmarks: 0, weeklyLessonIds: [], weeklyAttempts: 0, weeklyGoal: 90, currentStreak: 0, longestStreak: 0 };
const achievementCopy: Record<AchievementId, { title: string; detail: string }> = {
  first_lesson: { title: "完成第一课", detail: "建立第一条学习记录" }, first_quiz: { title: "第一次自测", detail: "用题目检查理解" }, first_practice: { title: "第一次练图", detail: "提交结构化案例判断" },
  three_day_streak: { title: "连续三天", detail: "形成轻量学习节奏" }, weekly_goal: { title: "本周达标", detail: "完成设定的周分钟数" }, foundation_complete: { title: "基础模块", detail: "完成前六节基础课程" },
};

export function DashboardProgress({ modules, chartCases, accountSync = false }: { modules: CourseModule[]; chartCases: ChartCase[]; accountSync?: boolean }) {
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const lessons = modules.flatMap((item) => item.lessons);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(readLocalProgress()));
    if (accountSync) fetch("/api/me/summary").then(async (response) => response.ok ? response.json() : null).then((data) => { if (data) setProgress(data); }).catch(() => undefined);
    return () => cancelAnimationFrame(frame);
  }, [accountSync]);
  const percent = Math.round((progress.complete / lessons.length) * 100);
  const weeklyMinutes = progress.weeklyLessonIds.reduce((sum, id) => sum + (lessons.find((lesson) => lesson.id === id)?.duration ?? 0), 0) + progress.weeklyAttempts * 12;
  const weeklyPercent = Math.min(100, Math.round((weeklyMinutes / progress.weeklyGoal) * 100));
  const earned = new Set(earnedAchievements({ completedLessons: progress.complete, quizAttempts: progress.quizzes, practiceAttempts: progress.attempts, longestStreak: progress.longestStreak, weeklyMinutes, weeklyGoal: progress.weeklyGoal }));
  const nextLesson = lessons.find((lesson) => !progress.completedLessonIds.includes(lesson.id)) ?? lessons.at(-1)!;
  const nextModule = modules.find((item) => item.lessons.some((lesson) => lesson.id === nextLesson.id)) ?? modules[0];
  return <>
    <section className="dashboard-resume"><div><span>继续学习</span><h2>{nextLesson.title}</h2><p>{nextLesson.summary}</p><div><i><b style={{ width: `${percent}%` }} /></i><span>{percent}%</span></div></div><Link className="button button-primary" href={`/learn/${nextModule.slug}/${nextLesson.slug}`}>继续课程 <ArrowRight /></Link></section>
    <section className="weekly-habit"><Flame /><div><span>本周学习习惯 · 连续 {progress.currentStreak} 天（最长 {progress.longestStreak} 天）</span><strong>{weeklyMinutes} / {progress.weeklyGoal} 分钟</strong><i><b style={{ width: `${weeklyPercent}%` }} /></i><small>{weeklyPercent >= 100 ? "本周目标已完成，保持稳定比突击更重要。" : `再完成约 ${Math.max(0, progress.weeklyGoal - weeklyMinutes)} 分钟即可达标。`}</small></div><Link href="/settings">调整目标</Link></section>
    <section className="dashboard-stats"><article><CheckCircle2 /><strong>{progress.complete}</strong><span>已完成课程</span></article><article><FlaskConical /><strong>{progress.attempts}</strong><span>练习提交</span></article><article><FileText /><strong>{progress.notes}</strong><span>学习笔记</span></article><article><Bookmark /><strong>{progress.bookmarks}</strong><span>收藏内容</span></article></section>
    <section className="achievement-section"><header><div><span>Milestones</span><h2>学习里程碑</h2></div><small>{earned.size} / {Object.keys(achievementCopy).length} 已获得</small></header><div>{(Object.entries(achievementCopy) as Array<[AchievementId, { title: string; detail: string }]>).map(([id, copy]) => <article className={earned.has(id) ? "earned" : ""} key={id}><Award /><div><b>{copy.title}</b><span>{copy.detail}</span></div><small>{earned.has(id) ? "已获得" : "尚未获得"}</small></article>)}</div></section>
    <section className="dashboard-next"><header><h2>推荐下一步</h2><Link href="/cases">全部案例 <ArrowRight /></Link></header><div>{chartCases.slice(0, 3).map((item) => <Link href={`/practice/${item.slug}`} key={item.id}><span>{item.difficulty}</span><b>{item.title}</b><small>{item.duration} 分钟 · {item.knowledgeTags.slice(0, 2).join(" / ")}</small></Link>)}</div></section>
  </>;
}

function readLocalProgress(): Progress {
  const keys = Object.keys(window.localStorage); const weekStart = startOfUtcWeek().getTime();
  const completedLessonIds = keys.filter((key) => key.startsWith("chartlab:complete:") && window.localStorage.getItem(key) === "true").map((key) => key.replace("chartlab:complete:", ""));
  const completionDates = keys.filter((key) => key.startsWith("chartlab:completeAt:")).flatMap((key) => validDate(window.localStorage.getItem(key)));
  const quizDates = keys.filter((key) => key.startsWith("chartlab:quiz:")).flatMap((key) => validDate(readJsonDate(window.localStorage.getItem(key), "at")));
  const attemptKeys = keys.filter((key) => key.startsWith("chartlab:attempt:"));
  const attemptDates = attemptKeys.flatMap((key) => validDate(readJsonDate(window.localStorage.getItem(key), "submittedAt")));
  const streak = learningStreak([...completionDates, ...quizDates, ...attemptDates]);
  return { complete: completedLessonIds.length, completedLessonIds, notes: keys.filter((key) => key.startsWith("chartlab:note:") && window.localStorage.getItem(key)).length, attempts: attemptKeys.length, quizzes: quizDates.length, bookmarks: keys.filter((key) => key.startsWith("chartlab:bookmark:") && window.localStorage.getItem(key) === "true").length, weeklyLessonIds: keys.filter((key) => key.startsWith("chartlab:completeAt:") && new Date(window.localStorage.getItem(key) ?? 0).getTime() >= weekStart).map((key) => key.replace("chartlab:completeAt:", "")), weeklyAttempts: attemptDates.filter((date) => date.getTime() >= weekStart).length, weeklyGoal: 90, currentStreak: streak.current, longestStreak: streak.longest };
}

function validDate(value: string | null | undefined) { if (!value) return []; const date = new Date(value); return Number.isNaN(date.getTime()) ? [] : [date]; }
function readJsonDate(value: string | null, key: "at" | "submittedAt") { try { const parsed = JSON.parse(value ?? "{}"); return key === "submittedAt" ? parsed.result?.submittedAt : parsed.at; } catch { return null; } }
