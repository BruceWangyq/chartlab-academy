import { z } from "zod";
import type { ChartCase } from "@/lib/content";

export const practiceSubmissionSchema = z.object({
  trend: z.enum(["up", "down", "range"]),
  support: z.tuple([z.number(), z.number()]).refine(([low, high]) => low < high, "支撑区域下沿必须小于上沿"),
  resistance: z.tuple([z.number(), z.number()]).refine(([low, high]) => low < high, "阻力区域下沿必须小于上沿"),
  reasonTags: z.array(z.enum(["structure", "volume", "invalidation", "context"])).min(1),
  reason: z.string().trim().min(10).max(600),
  reactionPoints: z.array(z.number().min(0).max(100)).max(6).default([]),
  annotations: z.array(z.object({ type: z.enum(["trendline", "zone", "label"]), points: z.array(z.number()), label: z.string().optional() })).max(20).default([]),
});

export type PracticeSubmission = z.infer<typeof practiceSubmissionSchema>;
export type PracticeScore = { total: number; trend: number; zones: number; keyPoints: number; reasoning: number; feedback: string[] };

function intervalOverlap(actual: [number, number], expected: [number, number]) {
  const intersection = Math.max(0, Math.min(actual[1], expected[1]) - Math.max(actual[0], expected[0]));
  const union = Math.max(actual[1], expected[1]) - Math.min(actual[0], expected[0]);
  return union === 0 ? 0 : intersection / union;
}

export function scorePractice(chartCase: ChartCase, submission: PracticeSubmission): PracticeScore {
  const trend = submission.trend === chartCase.expectedTrend ? 40 : 0;
  const supportOverlap = intervalOverlap(submission.support, chartCase.support);
  const resistanceOverlap = intervalOverlap(submission.resistance, chartCase.resistance);
  const zones = Math.round(((supportOverlap + resistanceOverlap) / 2) * 32);
  const coveredKeyPoints = chartCase.reactionPoints.filter((expected) => submission.reactionPoints.some((actual) => Math.abs(actual - expected) <= 6)).length;
  const keyPoints = chartCase.reactionPoints.length ? Math.round(coveredKeyPoints / chartCase.reactionPoints.length * 8) : 8;
  const reasonSignals = [submission.reasonTags.includes("structure"), submission.reasonTags.includes("invalidation"), submission.reason.length >= 20];
  const reasoning = Math.round((reasonSignals.filter(Boolean).length / reasonSignals.length) * 20);
  const total = trend + zones + keyPoints + reasoning;
  const feedback = [
    trend === 40 ? "趋势判断与参考结构一致。" : "趋势判断不同于参考答案，请重新检查高低点序列。",
    zones >= 23 ? "关键区域与参考区间有较高重叠。" : zones >= 10 ? "区域方向基本合理，但边界可以更聚焦。" : "区域与主要历史反应带重叠较少。",
    keyPoints >= 6 ? "标出的时间位置覆盖了主要历史反应点。" : keyPoints > 0 ? "已覆盖部分反应点，可再检查遗漏的确认位置。" : "尚未标出关键反应所在的时间位置。",
    reasoning >= 14 ? "理由包含结构与失效条件，便于后续复盘。" : "补充结构证据和失效条件，会让判断更可检验。",
  ];
  return { total, trend, zones, keyPoints, reasoning, feedback };
}
