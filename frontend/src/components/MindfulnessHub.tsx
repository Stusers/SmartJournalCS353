import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { JournalEntry } from 'shared';

export default function MindfulnessHub() {
  const { user } = useAuth();
  const api = useApi();
  const { journalApi, userApi } = api; // Keep existing destructuring
  // @ts-ignore
  const devApi = api.devApi;
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [meditationStreak, setMeditationStreak] = useState(0);

  const handleMasterReset = async () => {
    if (!confirm("Are you sure? This will DELETE ALL DATA and insert demo data. This cannot be undone.")) return;

    try {
      setLoading(true);
      await devApi.reset();
      alert("Database reset and seeded with demo data! Reloading...");
      window.location.reload();
    } catch (error) {
      console.error("Reset failed:", error);
      alert("Reset failed. Check console.");
      setLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [allEntries, stats] = await Promise.all([
        journalApi.getByUserId(user.id, 100), // Fetch more to calculate streaks better
        userApi.getStats()
      ]);

      setCurrentStreak(stats.current_streak);

      // Calculate Meditation Streak (entries with tag 'meditation')
      const meditationEntries = allEntries.filter(e =>
        e.tags && e.tags.includes('meditation')
      );

      const mStreak = calculateStreakFromEntries(meditationEntries);
      setMeditationStreak(mStreak);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, journalApi, userApi]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const calculateStreakFromEntries = (entries: JournalEntry[]) => {
    if (entries.length === 0) return 0;

    // Sort entries by date, newest first
    const sortedEntries = [...entries].sort((a, b) =>
      new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's an entry for today
    const firstEntryDate = new Date(sortedEntries[0].entry_date);
    firstEntryDate.setHours(0, 0, 0, 0);

    let currentDate = today;

    // If no entry for today, check yesterday for streak continuation
    if (firstEntryDate.getTime() !== today.getTime()) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (firstEntryDate.getTime() !== yesterday.getTime()) {
        return 0; // Streak broken or not started today/yesterday
      }
      currentDate = yesterday;
    }

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.entry_date);
      entryDate.setHours(0, 0, 0, 0);

      const diffTime = currentDate.getTime() - entryDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        streak++;
        // Move expected date back by one day for next iteration
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (diffDays > 0) {
        // Gap found
        break;
      }
      // Ignore duplicates (diffDays < 0 shouldn't happen with sorted list and simple logic)
    }

    return streak;
  };

  const handleCompleteSession = async () => {
    if (!user) return;
    try {
      await journalApi.create(
        user.id,
        "Completed a mindfulness breathing session.",
        "calm",
        ['meditation']
      );
      alert("Session logged! Great job taking a moment for yourself.");
      loadData(); // Reload to update stats
    } catch (error) {
      console.error("Failed to log session:", error);
      alert("Failed to log session.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-center text-gray-600">Loading...</p>
      </div>
    );
  }

  const exercises = [
    { icon: '🌤️', title: 'Daily Reset', duration: 'Tips', description: 'Pick 3 priorities for tomorrow → avoid waking up overwhelmed → Switch off early → less screen 30–60 minutes before bed → tell yourself “I did enough for today”' },
    { icon: '🌙', title: 'Evening Wind-Down', duration: 'Tips', description: 'Listen to Gentle narration and ambient music → Do a 3-minute journal: gratitude  →  one win, one release → Plan tomorrow lightly (2 tasks + 1 personal intention)' },
    { icon: '💭', title: 'Mindful Reflection', duration: 'Tips', description: '"Notice three things you\'re grateful for." 🌸 Micro gratitude, not pressure gratitude  →  Practice non-judgment ' },
    { icon: '🧘', title: 'Body Scan', duration: 'Tips', description: 'Guided voice with progress bar, 🌿 Set the tone: Sit or lie comfortably (bed, couch, or floor)  →  Loosen any tight clothing  → Dim the lights or close your eyes  → Keep arms relaxed by your sides' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Page Title */}
      <div className="text-center">
        <h1>Settings & Mindfulness</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and practice mindfulness</p>
      </div>

      {/* User Profile Section */}
      <Card className="p-6 bg-white/90 backdrop-blur">
        <h2 className="mb-4 text-lg font-semibold">👤 User Profile</h2>
        <div className="space-y-3">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Username</span>
            <span className="font-medium">{user?.username}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Member Since</span>
            <span className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </Card>

      {/* Dev Tools */}
      <Card className="p-5 bg-red-50 border-red-100">
        <h3 className="text-red-800 font-semibold mb-2">⚡ Developer Tools</h3>
        <p className="text-sm text-red-600 mb-3">Reset your database and fill it with sample data.</p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleMasterReset}
        >
          Reset & Load Demo Data
        </Button>
      </Card>

      <div className="text-center pt-4">
        <h2>🧘 Mindfulness Exercises</h2>
      </div>

      {/* Exercise Cards */}
      <div className="space-y-3">
        {exercises.map((exercise, idx) => (
          <Card
            key={idx}
            className="p-5 bg-white/90 backdrop-blur hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-3xl">{exercise.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3>{exercise.title}</h3>
                    <span className="text-sm text-gray-500">({exercise.duration})</span>
                  </div>
                  <p className="text-sm text-gray-600">→ {exercise.description}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-sm text-gray-600 mb-1">🔥 Current Streak</div>
          <div className="text-2xl">{currentStreak} days</div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50">
          <div className="text-sm text-gray-600 mb-1">🌿 Meditation Streak</div>
          <div className="text-2xl">{meditationStreak} days</div>
        </Card>
      </div>

      {/* Breathing Exercise Preview */}
      <Card className="p-8 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border-none">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-white/50 flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-purple-400/50"></div>
          </div>
          <p className="text-center text-gray-700">Breathe in... Breathe out...</p>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
            onClick={handleCompleteSession}
          >
            Complete Session & Log
          </Button>
        </div>
      </Card>
    </div>
  );
}
