const DAY_MS = 86_400_000;

export type AchievementId = "first_lesson" | "first_quiz" | "first_practice" | "three_day_streak" | "weekly_goal" | "foundation_complete";

export function startOfUtcWeek(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start;
}

export function learningStreak(activity: Array<Date | string>, now = new Date()) {
  const days = [...new Set(activity.map(dayNumber).filter((value): value is number => value !== null))].sort((a, b) => a - b);
  let longest = 0; let run = 0; let previous: number | undefined;
  for (const day of days) { run = previous !== undefined && day === previous + 1 ? run + 1 : 1; longest = Math.max(longest, run); previous = day; }
  const today = dayNumber(now)!; const activeEnd = days.includes(today) ? today : days.includes(today - 1) ? today - 1 : null;
  let current = 0;
  if (activeEnd !== null) { const set = new Set(days); for (let day = activeEnd; set.has(day); day -= 1) current += 1; }
  return { current, longest };
}

export function earnedAchievements(input: { completedLessons: number; quizAttempts: number; practiceAttempts: number; longestStreak: number; weeklyMinutes: number; weeklyGoal: number }): AchievementId[] {
  const earned: AchievementId[] = [];
  if (input.completedLessons >= 1) earned.push("first_lesson");
  if (input.quizAttempts >= 1) earned.push("first_quiz");
  if (input.practiceAttempts >= 1) earned.push("first_practice");
  if (input.longestStreak >= 3) earned.push("three_day_streak");
  if (input.weeklyMinutes >= input.weeklyGoal) earned.push("weekly_goal");
  if (input.completedLessons >= 6) earned.push("foundation_complete");
  return earned;
}

function dayNumber(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS);
}
