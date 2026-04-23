import { useCallback, useMemo, useState } from "react";
import {
  claimLocalStreak,
  getDateKey,
  getRewardForDay,
  isAlreadyClaimedToday,
  loadLocalStreak,
  STREAK_REWARDS,
  type LocalStreakState,
} from "../lib/dailyRewards";
import { isEnabled } from "../lib/featureFlags";

export interface DailyStreakState {
  enabled: boolean;
  streak: LocalStreakState;
  claimedToday: boolean;
  currentDayReward: (typeof STREAK_REWARDS)[number];
  nextRewards: (typeof STREAK_REWARDS)[number][];
  claim: () => { alreadyClaimed: boolean; reward: (typeof STREAK_REWARDS)[number] };
}

export function useDailyStreak(): DailyStreakState {
  const enabled = isEnabled("DAILY_REWARDS");
  const [streak, setStreak] = useState<LocalStreakState>(loadLocalStreak);

  const today = getDateKey();
  const claimedToday = isAlreadyClaimedToday(streak.lastClaimDate, today);

  const currentDayReward = useMemo(
    () => getRewardForDay(claimedToday ? streak.currentStreak : streak.currentStreak + 1),
    [claimedToday, streak.currentStreak],
  );

  const nextRewards = useMemo(() => {
    const startDay = claimedToday ? streak.currentStreak + 1 : streak.currentStreak + 1;
    return STREAK_REWARDS.map((_, i) => getRewardForDay(startDay + i));
  }, [claimedToday, streak.currentStreak]);

  const claim = useCallback(() => {
    const result = claimLocalStreak();
    setStreak(result.newStreak);
    return result;
  }, []);

  return {
    enabled,
    streak,
    claimedToday,
    currentDayReward,
    nextRewards,
    claim,
  };
}
