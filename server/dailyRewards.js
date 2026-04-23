/**
 * server/dailyRewards.js — Daily login reward / streak handlers.
 *
 * The client can claim once per calendar day (UTC). Consecutive days increase
 * the streak; missed days reset to 1. Rewards escalate on a 7-day cycle.
 */

const STREAK_REWARDS = [
  { day: 1, ozzies: 10 },
  { day: 2, ozzies: 15 },
  { day: 3, ozzies: 25 },
  { day: 4, ozzies: 30 },
  { day: 5, ozzies: 50 },
  { day: 6, ozzies: 75 },
  { day: 7, ozzies: 150 },
];

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getRewardForDay(streakDay) {
  const index = ((streakDay - 1) % STREAK_REWARDS.length);
  return STREAK_REWARDS[index];
}

function isConsecutiveDay(lastClaimDate, today) {
  const last = new Date(lastClaimDate + 'T00:00:00Z');
  const current = new Date(today + 'T00:00:00Z');
  const diff = current.getTime() - last.getTime();
  return diff === 24 * 60 * 60 * 1000;
}

export function registerDailyRewardRoutes(app, { adminDb, dailyRewardRateLimit, authenticateFirebaseUser, FieldValue }) {
  app.get('/api/daily-streak', dailyRewardRateLimit, async (req, res) => {
    try {
      const decoded = await authenticateFirebaseUser(req);
      if (!adminDb) return res.status(503).json({ error: 'Service unavailable.' });

      const docRef = adminDb.collection('dailyStreaks').doc(decoded.uid);
      const snap = await docRef.get();
      const data = snap.exists ? snap.data() : null;

      const today = getDateKey();
      const claimedToday = data?.lastClaimDate === today;
      const currentStreak = data?.currentStreak ?? 0;

      res.json({
        ok: true,
        data: {
          currentStreak,
          longestStreak: data?.longestStreak ?? 0,
          lastClaimDate: data?.lastClaimDate ?? null,
          totalClaims: data?.totalClaims ?? 0,
          claimedToday,
          nextReward: getRewardForDay(claimedToday ? currentStreak + 1 : (currentStreak > 0 ? currentStreak + 1 : 1)),
        },
      });
    } catch (err) {
      const status = err.statusCode ?? 500;
      res.status(status).json({ error: err.message ?? 'Internal error.' });
    }
  });

  app.post('/api/daily-streak/claim', dailyRewardRateLimit, async (req, res) => {
    try {
      const decoded = await authenticateFirebaseUser(req);
      if (!adminDb) return res.status(503).json({ error: 'Service unavailable.' });

      const today = getDateKey();
      const docRef = adminDb.collection('dailyStreaks').doc(decoded.uid);
      const snap = await docRef.get();
      const data = snap.exists ? snap.data() : {};

      if (data.lastClaimDate === today) {
        return res.status(409).json({ error: 'Already claimed today.', claimedToday: true });
      }

      const consecutive = data.lastClaimDate
        ? isConsecutiveDay(data.lastClaimDate, today)
        : false;
      const nextStreak = consecutive ? (data.currentStreak ?? 0) + 1 : 1;
      const longestStreak = Math.max(data.longestStreak ?? 0, nextStreak);
      const reward = getRewardForDay(nextStreak);

      await docRef.set({
        uid: decoded.uid,
        currentStreak: nextStreak,
        longestStreak,
        lastClaimDate: today,
        totalClaims: (data.totalClaims ?? 0) + 1,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      res.json({
        ok: true,
        data: {
          currentStreak: nextStreak,
          longestStreak,
          reward,
          totalClaims: (data.totalClaims ?? 0) + 1,
        },
      });
    } catch (err) {
      const status = err.statusCode ?? 500;
      res.status(status).json({ error: err.message ?? 'Internal error.' });
    }
  });
}

export function getDailyStreak(_req, res) {
  res.json({ ok: true, data: null });
}

export function claimDailyReward(_req, res) {
  res.json({ ok: true, data: null });
}
