import { describe, expect, it } from "vitest";
import { chartCases } from "@/lib/content";
import { practiceSubmissionSchema, scorePractice } from "@/lib/scoring";

describe("practice scoring", () => {
  const chartCase = chartCases[0];
  it("awards a perfect, explainable score for the reference answer", () => {
    const score = scorePractice(chartCase, { trend: chartCase.expectedTrend, support: chartCase.support, resistance: chartCase.resistance, reactionPoints: chartCase.reactionPoints, reasonTags: ["structure", "invalidation"], reason: "高低点结构向下；如果价格重新接纳前高上方，则当前判断失效。", annotations: [] });
    expect(score).toEqual(expect.objectContaining({ total: 100, trend: 40, zones: 32, keyPoints: 8, reasoning: 20 }));
    expect(score.feedback).toHaveLength(4);
  });
  it("keeps trend, zone and reasoning scores independent", () => {
    const score = scorePractice(chartCase, { trend: "range", support: [0, 1], resistance: [200, 210], reactionPoints: [], reasonTags: ["volume"], reason: "成交量发生变化但没有写出结构或明确失效条件。", annotations: [] });
    expect(score.trend).toBe(0); expect(score.zones).toBe(0); expect(score.keyPoints).toBe(0); expect(score.reasoning).toBe(7); expect(score.total).toBe(7);
  });
  it("reports a partial overlap separately from a missed region", () => {
    const score = scorePractice(chartCase, { trend: chartCase.expectedTrend, support: [78, 85], resistance: [117, 122], reactionPoints: [chartCase.reactionPoints[0]], reasonTags: ["structure"], reason: "高低点结构支持当前方向，但区域边界仍需要更多反应点确认。", annotations: [] });
    expect(score.zones).toBeGreaterThanOrEqual(10); expect(score.zones).toBeLessThan(23); expect(score.keyPoints).toBeGreaterThan(0); expect(score.feedback[1]).toMatch(/边界/);
  });
  it("rejects incomplete and inverted regions", () => {
    const parsed = practiceSubmissionSchema.safeParse({ trend: "up", support: [10, 9], resistance: [20, 21], reactionPoints: [101], reasonTags: [], reason: "太短", annotations: [] });
    expect(parsed.success).toBe(false);
  });
});
