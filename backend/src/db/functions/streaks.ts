import { query, transaction } from '../helpers.js';
import { UserStreak, UserStats } from '../../types/index.js';

export async function initializeUserStreak(userId: number): Promise<UserStreak> {
  const result = await query<UserStreak>(
    `INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_entries)
     VALUES ($1, 0, 0, 0)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING *`,
    [userId]
  );

  return result.rows[0];
}

export async function getUserStreak(userId: number): Promise<UserStreak | null> {
  const result = await query<UserStreak>(
    'SELECT * FROM user_streaks WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return initializeUserStreak(userId);
  }

  return result.rows[0];
}

export async function updateStreakAfterEntry(userId: number, entryDate: Date): Promise<UserStreak> {
  return transaction(async (client) => {
    const streakResult = await client.query<UserStreak>(
      'SELECT * FROM user_streaks WHERE user_id = $1 FOR UPDATE',
      [userId]
    );

    let streak = streakResult.rows[0];
    if (!streak) {
      const initResult = await client.query<UserStreak>(
        `INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_entries)
         VALUES ($1, 0, 0, 0)
         RETURNING *`,
        [userId]
      );
      streak = initResult.rows[0];
    }

    const today = new Date(entryDate);
    today.setHours(0, 0, 0, 0);

    let newCurrentStreak = streak.current_streak;
    const lastEntryDate = streak.last_entry_date ? new Date(streak.last_entry_date) : null;

    if (lastEntryDate) {
      lastEntryDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        newCurrentStreak += 1;
      } else if (daysDiff > 1) {
        newCurrentStreak = 1;
      }
    } else {
      newCurrentStreak = 1;
    }

    const newLongestStreak = Math.max(newCurrentStreak, streak.longest_streak);
    const newTotalEntries = streak.total_entries + 1;

    const updateResult = await client.query<UserStreak>(
      `UPDATE user_streaks
       SET current_streak = $1,
           longest_streak = $2,
           total_entries = $3,
           last_entry_date = $4
       WHERE user_id = $5
       RETURNING *`,
      [newCurrentStreak, newLongestStreak, newTotalEntries, entryDate, userId]
    );

    return updateResult.rows[0];
  });
}

export async function useStreakFreeze(userId: number): Promise<UserStreak | null> {
  const result = await query<UserStreak>(
    `UPDATE user_streaks
     SET streak_freeze_count = streak_freeze_count + 1
     WHERE user_id = $1
     RETURNING *`,
    [userId]
  );

  return result.rows[0] || null;
}

export async function getUserStats(userId: number): Promise<UserStats> {
  const streak = await getUserStreak(userId);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const weekResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM journal_entries
     WHERE user_id = $1 AND entry_date >= $2`,
    [userId, startOfWeek]
  );

  const monthResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM journal_entries
     WHERE user_id = $1 AND entry_date >= $2`,
    [userId, startOfMonth]
  );

  const achievementsResult = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1',
    [userId]
  );

  return {
    total_entries: streak?.total_entries || 0,
    current_streak: streak?.current_streak || 0,
    longest_streak: streak?.longest_streak || 0,
    achievements_earned: parseInt(achievementsResult.rows[0].count),
    entries_this_week: parseInt(weekResult.rows[0].count),
    entries_this_month: parseInt(monthResult.rows[0].count),
  };
}
