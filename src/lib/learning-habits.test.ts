import { describe, expect, it } from "vitest";
import { earnedAchievements, learningStreak, startOfUtcWeek } from "@/lib/learning-habits";

describe("learning habits", () => {
  it("starts the learning week on Monday UTC", () => {
    expect(startOfUtcWeek(new Date("2026-07-22T12:00:00Z")).toISOString()).toBe("2026-07-20T00:00:00.000Z");
  });

  it("keeps a current streak alive through yesterday and tracks the longest run", () => {
    const result = learningStreak(["2026-07-15", "2026-07-16", "2026-07-20", "2026-07-21"], new Date("2026-07-22T12:00:00Z"));
    expect(result).toEqual({ current: 2, longest: 2 });
  });

  it("does not count a stale streak as current", () => {
    expect(learningStreak(["2026-07-10", "2026-07-11"], new Date("2026-07-22T12:00:00Z")).current).toBe(0);
  });

  it("derives lightweight achievements without storing a game economy", () => {
    expect(earnedAchievements({ completedLessons: 6, quizAttempts: 2, practiceAttempts: 1, longestStreak: 3, weeklyMinutes: 120, weeklyGoal: 90 })).toEqual(["first_lesson", "first_quiz", "first_practice", "three_day_streak", "weekly_goal", "foundation_complete"]);
  });
});
