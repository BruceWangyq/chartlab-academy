import { describe, expect, it } from "vitest";
import { recommendedLearningPath } from "@/lib/onboarding-recommendation";

describe("recommendedLearningPath", () => {
  it("starts beginners with the foundation lesson", () => expect(recommendedLearningPath("beginner")).toContain("chart-foundations/market-language"));
  it("sends experienced learners to the matching public entry point", () => {
    expect(recommendedLearningPath("intermediate")).toContain("candlestick-language");
    expect(recommendedLearningPath("advanced")).toContain("/cases");
  });
});
