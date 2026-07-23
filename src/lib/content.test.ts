import { describe, expect, it } from "vitest";
import { chartCases, contentCounts, getCase, getLesson, getModule, lessons, modules } from "@/lib/content";
describe("MVP seed content", () => {
  it("matches the PRD launch inventory", () => { expect(contentCounts).toEqual({ modules: 4, lessons: 24, questions: 72, cases: 30 }); });
  it("uses unique stable slugs and ids", () => { expect(new Set(lessons.map((item) => item.slug)).size).toBe(lessons.length); expect(new Set(chartCases.map((item) => item.id)).size).toBe(chartCases.length); });
  it("contains complete lesson and case acceptance fields", () => { for (const courseModule of modules) expect(courseModule.lessons).toHaveLength(6); for (const lesson of lessons) { expect(lesson.objectives.length).toBeGreaterThanOrEqual(2); expect(lesson.mistakes.length).toBeGreaterThanOrEqual(2); expect(lesson.quiz.length).toBeGreaterThanOrEqual(3); expect(lesson.quiz.some((question) => question.chartSeed !== undefined)).toBe(true); } for (const chartCase of chartCases) { expect(chartCase.knowledgeTags.length).toBeGreaterThanOrEqual(3); expect(chartCase.support[0]).toBeLessThan(chartCase.support[1]); } });
  it("resolves valid routes and rejects unknown slugs", () => {
    expect(getModule("chart-foundations")?.id).toBe("m01"); expect(getModule("missing")).toBeUndefined();
    expect(getLesson("market-language")?.module.id).toBe("m01"); expect(getLesson("missing")).toBeUndefined();
    expect(getCase("historical-case-01")?.id).toBe("case-01"); expect(getCase("missing")).toBeUndefined();
  });
});
