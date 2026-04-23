/**
 * dailyRewards.ts — Daily login streak + escalating Ozzies rewards.
 *
 * Reward schedule escalates with consecutive days, resetting on missed days.
 * Day 7 is the weekly jackpot, then the cycle repeats.
 */

export const STREAK_REWARDS = [
  { day: 1, ozzies: 10,  label: "Day 1",  bonus: "" },
  { day: 2, ozzies: 15,  label: "Day 2",  bonus: "" },
  { day: 3, ozzies: 25,  label: "Day 3",  bonus: "+XP boost" },
  { day: 4, ozzies: 30,  label: "Day 4",  bonus: "" },
  { day: 5, ozzies: 50,  label: "Day 5",  bonus: "+Forge credit" },
  { day: 6, ozzies: 75,  label: "Day 6",  bonus: "" },
  { day: 7, ozzies: 150, label: "Day 7",  bonus: "Jackpot!" },
] as const;

export function getRewardForDay(streakDay: number) {
  const index = ((streakDay - 1) % STREAK_REWARDS.length);
  return STREAK_REWARDS[index];
}

export function getDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isConsecutiveDay(lastClaimDate: string, today: string): boolean {
  const last = new Date(lastClaimDate + "T00:00:00Z");
  const current = new Date(today + "T00:00:00Z");
  const diff = current.getTime() - last.getTime();
  return diff === 24 * 60 * 60 * 1000;
}

export function isAlreadyClaimedToday(lastClaimDate: string, today: string): boolean {
  return lastClaimDate === today;
}

const STREAK_STORAGE_KEY = "skpd_daily_streak";

export interface LocalStreakState {
  currentStreak: number;
  lastClaimDate: string;
  totalOzziesEarned: number;
}

export function loadLocalStreak(): LocalStreakState {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return { currentStreak: 0, lastClaimDate: "", totalOzziesEarned: 0 };
    return JSON.parse(raw) as LocalStreakState;
  } catch {
    return { currentStreak: 0, lastClaimDate: "", totalOzziesEarned: 0 };
  }
}

export function saveLocalStreak(state: LocalStreakState): void {
  localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(state));
}

export function claimLocalStreak(): {
  reward: (typeof STREAK_REWARDS)[number];
  newStreak: LocalStreakState;
  alreadyClaimed: boolean;
} {
  const today = getDateKey();
  const current = loadLocalStreak();

  if (isAlreadyClaimedToday(current.lastClaimDate, today)) {
    const reward = getRewardForDay(current.currentStreak);
    return { reward, newStreak: current, alreadyClaimed: true };
  }

  const consecutive = current.lastClaimDate
    ? isConsecutiveDay(current.lastClaimDate, today)
    : false;
  const nextStreak = consecutive ? current.currentStreak + 1 : 1;
  const reward = getRewardForDay(nextStreak);

  const newStreak: LocalStreakState = {
    currentStreak: nextStreak,
    lastClaimDate: today,
    totalOzziesEarned: current.totalOzziesEarned + reward.ozzies,
  };

  saveLocalStreak(newStreak);
  return { reward, newStreak, alreadyClaimed: false };
}
