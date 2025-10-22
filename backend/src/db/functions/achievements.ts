import { query } from '../helpers.js';
import { Achievement, UserAchievement } from '../../types/index.js';

export async function getAllAchievements(): Promise<Achievement[]> {
  const result = await query<Achievement>(
    'SELECT * FROM achievements ORDER BY requirement_value ASC'
  );

  return result.rows;
}

export async function getAchievementById(achievementId: number): Promise<Achievement | null> {
  const result = await query<Achievement>(
    'SELECT * FROM achievements WHERE id = $1',
    [achievementId]
  );

  return result.rows[0] || null;
}

export async function getUserAchievements(userId: number): Promise<Achievement[]> {
  const result = await query<Achievement>(
    `SELECT a.* FROM achievements a
     INNER JOIN user_achievements ua ON a.id = ua.achievement_id
     WHERE ua.user_id = $1
     ORDER BY ua.earned_at DESC`,
    [userId]
  );

  return result.rows;
}

export async function grantAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
  const result = await query<UserAchievement>(
    `INSERT INTO user_achievements (user_id, achievement_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, achievement_id) DO NOTHING
     RETURNING *`,
    [userId, achievementId]
  );

  return result.rows[0];
}

export async function checkAndGrantAchievements(userId: number): Promise<Achievement[]> {
  const allAchievements = await getAllAchievements();
  const userAchievements = await getUserAchievements(userId);
  const userAchievementIds = new Set(userAchievements.map(a => a.id));

  const streakResult = await query<{ current_streak: number; total_entries: number }>(
    'SELECT current_streak, total_entries FROM user_streaks WHERE user_id = $1',
    [userId]
  );

  if (streakResult.rows.length === 0) {
    return [];
  }

  const { current_streak, total_entries } = streakResult.rows[0];
  const newlyGranted: Achievement[] = [];

  for (const achievement of allAchievements) {
    if (userAchievementIds.has(achievement.id)) {
      continue;
    }

    let qualifies = false;

    switch (achievement.requirement_type) {
      case 'streak':
        qualifies = current_streak >= achievement.requirement_value;
        break;
      case 'total_entries':
        qualifies = total_entries >= achievement.requirement_value;
        break;
    }

    if (qualifies) {
      await grantAchievement(userId, achievement.id);
      newlyGranted.push(achievement);
    }
  }

  return newlyGranted;
}

export async function getUserAchievementProgress(userId: number): Promise<any[]> {
  const allAchievements = await getAllAchievements();
  const userAchievements = await getUserAchievements(userId);
  const userAchievementIds = new Set(userAchievements.map(a => a.id));

  const streakResult = await query<{ current_streak: number; total_entries: number }>(
    'SELECT current_streak, total_entries FROM user_streaks WHERE user_id = $1',
    [userId]
  );

  const stats = streakResult.rows[0] || { current_streak: 0, total_entries: 0 };

  return allAchievements.map(achievement => {
    const earned = userAchievementIds.has(achievement.id);
    let progress = 0;
    let currentValue = 0;

    switch (achievement.requirement_type) {
      case 'streak':
        currentValue = stats.current_streak;
        progress = Math.min((currentValue / achievement.requirement_value) * 100, 100);
        break;
      case 'total_entries':
        currentValue = stats.total_entries;
        progress = Math.min((currentValue / achievement.requirement_value) * 100, 100);
        break;
    }

    return {
      ...achievement,
      earned,
      progress: Math.round(progress),
      current_value: currentValue,
      required_value: achievement.requirement_value,
    };
  });
}
