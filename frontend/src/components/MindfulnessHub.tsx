import { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { useApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { JournalEntry } from 'shared';

export default function MindfulnessHub() {
  const { user } = useAuth();
  const { journalApi } = useApi();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const allEntries = await journalApi.getByUserId(user!.id, 50);

      // Get last 7 days of entries
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const weeklyEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        return entryDate >= sevenDaysAgo;
      });

      setEntries(weeklyEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  }, [user, journalApi]);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user, loadEntries]);

  const calculateStreak = () => {
    if (entries.length === 0) return 0;

    // Sort entries by date, newest first
    const sortedEntries = [...entries].sort((a, b) =>
      new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].entry_date);
      entryDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);

      const diffDays = Math.floor((expectedDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        streak++;
      } else if (diffDays > 0) {
        // Gap in streak, stop counting
        break;
      }
      // If diffDays < 0, this entry is from a future date relative to our expected date, skip it
    }

    return streak;
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
        <h1>Mindfulness Hub</h1>
        <p className="text-sm text-gray-500 mt-1">Your space for mindfulness and reflection</p>
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
          <div className="text-2xl">{calculateStreak()} days</div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50">
          <div className="text-sm text-gray-600 mb-1">🌿 Days Using Meditation In A Row</div>
          <div className="text-2xl">{calculateStreak()} days</div>
        </Card>
      </div>

      {/* Breathing Exercise Preview */}
      <Card className="p-8 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border-none">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-white/50 flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-purple-400/50"></div>
          </div>
          <p className="text-center text-gray-700">Breathe in... Breathe out...</p>
        </div>
      </Card>
    </div>
  );
}
