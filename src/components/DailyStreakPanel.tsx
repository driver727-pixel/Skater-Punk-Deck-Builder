import { useState } from "react";
import type { DailyStreakState } from "../hooks/useDailyStreak";
import { STREAK_REWARDS } from "../lib/dailyRewards";

interface DailyStreakPanelProps {
  dailyStreak: DailyStreakState;
}

export function DailyStreakPanel({ dailyStreak }: DailyStreakPanelProps) {
  const [showReward, setShowReward] = useState<{
    ozzies: number;
    bonus: string;
    day: number;
  } | null>(null);

  if (!dailyStreak.enabled) return null;

  const handleClaim = () => {
    const result = dailyStreak.claim();
    if (!result.alreadyClaimed) {
      setShowReward({
        ozzies: result.reward.ozzies,
        bonus: result.reward.bonus,
        day: result.reward.day,
      });
      setTimeout(() => setShowReward(null), 3000);
    }
  };

  const streakPosition = ((dailyStreak.streak.currentStreak - 1) % STREAK_REWARDS.length) + 1;

  return (
    <div className="daily-streak-panel">
      <div className="daily-streak-panel__header">
        <h3 className="daily-streak-panel__title">Daily Login Streak</h3>
        <span className="daily-streak-panel__counter">
          {dailyStreak.streak.currentStreak} day{dailyStreak.streak.currentStreak !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="daily-streak-panel__track">
        {STREAK_REWARDS.map((reward) => {
          const isCurrent = reward.day === (dailyStreak.claimedToday ? streakPosition : streakPosition + 1 > 7 ? 1 : streakPosition + 1);
          const isPast = dailyStreak.claimedToday
            ? reward.day <= streakPosition
            : reward.day < streakPosition;

          return (
            <div
              key={reward.day}
              className={`daily-streak-day${isPast ? " daily-streak-day--claimed" : ""}${isCurrent ? " daily-streak-day--current" : ""}${reward.day === 7 ? " daily-streak-day--jackpot" : ""}`}
            >
              <span className="daily-streak-day__label">{reward.label}</span>
              <span className="daily-streak-day__ozzies">{reward.ozzies}</span>
              {reward.bonus && <span className="daily-streak-day__bonus">{reward.bonus}</span>}
            </div>
          );
        })}
      </div>

      <div className="daily-streak-panel__actions">
        <button
          className={`btn-primary daily-streak-claim-btn${dailyStreak.claimedToday ? " daily-streak-claim-btn--claimed" : ""}`}
          onClick={handleClaim}
          disabled={dailyStreak.claimedToday}
        >
          {dailyStreak.claimedToday ? "Claimed Today" : `Claim ${dailyStreak.currentDayReward.ozzies} Ozzies`}
        </button>
        <span className="daily-streak-panel__total">
          Total earned: {dailyStreak.streak.totalOzziesEarned} Ozzies
        </span>
      </div>

      {showReward && (
        <div className="daily-streak-reward-popup" role="alert">
          <span className="daily-streak-reward-popup__ozzies">+{showReward.ozzies} Ozzies</span>
          {showReward.bonus && (
            <span className="daily-streak-reward-popup__bonus">{showReward.bonus}</span>
          )}
        </div>
      )}
    </div>
  );
}
