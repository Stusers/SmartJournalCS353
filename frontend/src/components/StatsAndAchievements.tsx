import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi, achievementApi, ApiError } from '../lib/api';
import type { UserStats } from 'shared';

interface StatsAndAchievementsProps {
  refreshTrigger?: number;
}

export function StatsAndAchievements({ refreshTrigger }: StatsAndAchievementsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievementProgress, setAchievementProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, refreshTrigger]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const [statsData, progressData] = await Promise.all([
        userApi.getStats(user.id),
        achievementApi.getUserProgress(user.id),
      ]);

      setStats(statsData);
      setAchievementProgress(progressData);
    } catch (err) {
      const errorMessage = err instanceof ApiError
        ? err.message
        : 'Failed to load stats and achievements';

      console.error('[StatsAndAchievements] Error loading data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="stats-container"><p>Loading stats...</p></div>;
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="error-message">{error}</div>
        <button onClick={loadData} className="btn-small">Retry</button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const earnedAchievements = achievementProgress.filter(a => a.earned);
  const unearnedAchievements = achievementProgress.filter(a => !a.earned);

  return (
    <div className="stats-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.current_streak}</div>
          <div className="stat-label">🔥 Current Streak</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.longest_streak}</div>
          <div className="stat-label">🏆 Longest Streak</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.total_entries}</div>
          <div className="stat-label">📝 Total Entries</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.achievements_earned}</div>
          <div className="stat-label">🎖️ Achievements</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.entries_this_week}</div>
          <div className="stat-label">📅 This Week</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.entries_this_month}</div>
          <div className="stat-label">📆 This Month</div>
        </div>
      </div>

      <div className="achievements-section">
        <h3>Achievements</h3>

        {earnedAchievements.length > 0 && (
          <div className="achievements-earned">
            <h4>Unlocked ({earnedAchievements.length})</h4>
            <div className="achievements-grid">
              {earnedAchievements.map((achievement) => (
                <div key={achievement.id} className="achievement-card earned">
                  <span className="achievement-icon">{achievement.icon || '🏆'}</span>
                  <div className="achievement-info">
                    <strong>{achievement.name}</strong>
                    {achievement.description && <p>{achievement.description}</p>}
                    <div className="achievement-requirement">
                      {achievement.current_value} / {achievement.required_value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {unearnedAchievements.length > 0 && (
          <div className="achievements-locked">
            <h4>Locked ({unearnedAchievements.length})</h4>
            <div className="achievements-grid">
              {unearnedAchievements.map((achievement) => (
                <div key={achievement.id} className="achievement-card locked">
                  <span className="achievement-icon">🔒</span>
                  <div className="achievement-info">
                    <strong>{achievement.name}</strong>
                    {achievement.description && <p>{achievement.description}</p>}
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                    <div className="achievement-requirement">
                      {achievement.current_value} / {achievement.required_value} ({achievement.progress}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
