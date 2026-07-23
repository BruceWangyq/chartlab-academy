export type LearningLevel = "beginner" | "intermediate" | "advanced";

export function recommendedLearningPath(level: LearningLevel) {
  if (level === "intermediate") return "/courses/candlestick-language?recommended=onboarding";
  if (level === "advanced") return "/cases?recommended=onboarding";
  return "/learn/chart-foundations/market-language?recommended=onboarding";
}
