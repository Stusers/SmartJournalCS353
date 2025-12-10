import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { JournalEntry } from 'shared';

export default function WeeklyReflection() {
  const { user } = useAuth();
  // Ensure useApi returns the extended object with aiApi
  const api = useApi();
  // @ts-ignore - aiApi is not yet in the shared types but is in the implementation
  const { journalApi, userApi, aiApi } = api;

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [insightLoading, setInsightLoading] = useState(false);

  // --- Data Loading Stuff ---
  const loadData = async () => {
    if (!user) {
      setLoading(false);
      setEntries([]);
      return;
    }

    try {
      setLoading(true);

      // fetch entries + stats at the same time (zoom zoom)
      const [allEntries, stats] = await Promise.all([
        journalApi.getByUserId(user.id, 50),
        userApi.getStats()
      ]);

      setStreak(stats.current_streak);

      // Filter for just the last week
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const weeklyEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        return entryDate >= sevenDaysAgo;
      });

      setEntries(weeklyEntries);
    } catch (error: unknown) {
      console.error('Failed to load data:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // --- AI Brain Power ---
  const generateInsight = async () => {
    if (entries.length === 0) {
      setAiInsight("Start journaling to see personalized insights about your patterns.");
      return;
    }

    try {
      setInsightLoading(true);
      // Fallback: mostly happy? mostly sad?
      const moods = entries.map(e => e.mood).filter(Boolean);
      let fallbackText = '';
      if (moods.length > 0) {
        const moodCounts = moods.reduce((acc, mood) => {
          acc[mood as string] = (acc[mood as string] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
        fallbackText = `Dominant mood: ${topMood}.`;
      }

      // Try the fancy AI
      try {
        if (aiApi) {
          const data = await aiApi.analyze(entries);
          if (data.insight) {
            setAiInsight(data.insight);
          } else {
            setAiInsight(fallbackText || "Keep journaling to unlock insights!");
          }
        } else {
          setAiInsight(fallbackText || "AI Service unavailable.");
        }
      } catch (err) {
        console.warn("AI API unavailable, using fallback", err);
        setAiInsight(fallbackText || "AI Analysis unavailable. Keep reflecting!");
      }

    } catch (e) {
      console.error(e);
      setAiInsight("Unable to generate insight right now.");
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    if (entries.length > 0) {
      generateInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  // --- Boring Helpers ---
  const moodToEmoji = (mood: string) => {
    if (!mood) return '';
    // If it's already an emoji (simple check), return it
    if (/\p{Emoji}/u.test(mood) && mood.length < 5) return mood;

    const map: Record<string, string> = {
      'Happy': '😊',
      'Excited': '🤩',
      'Grateful': '🙏',
      'Calm': '😌',
      'Relaxed': '😌',
      'Productive': '🚀',
      'Energetic': '⚡',
      'Tired': '😴',
      'Stressed': '😓',
      'Sad': '😢',
      'Anxious': '😰',
      'Angry': '😡',
      'Neutral': '😐'
    };
    return map[mood] || map[mood.charAt(0).toUpperCase() + mood.slice(1)] || '😐';
  };

  const getMoodForDay = (dayOffset: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (6 - dayOffset));
    const dateStr = targetDate.toISOString().split('T')[0];

    const entry = entries.find(e => {
      const d = new Date(e.entry_date);
      return d.toISOString().split('T')[0] === dateStr;
    });
    // Return only the emoji
    return moodToEmoji(entry?.mood || '');
  };

  const getWeekRange = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', options)} – ${today.toLocaleDateString('en-US', options)}, ${today.getFullYear()}`;
  };

  const getHighlights = () => {
    return entries
      .filter(e => e.gratitude_text && e.gratitude_text.length > 10)
      .slice(0, 3)
      .map(e => e.gratitude_text);
  };

  const handleSaveReflection = async () => {
    if (!reflection.trim()) return;

    if (!user) {
      alert("You are not logged in or your session has expired. Please refresh the page or log in again.");
      return;
    }

    try {
      console.log('Creating new entry');
      await journalApi.create(user.id, reflection, undefined, ['reflection']);

      setReflection('');
      loadData(); // Reload entries
      alert('Reflection saved successfully!');
    } catch (error: unknown) {
      console.error('Failed to save reflection:', error);
      if (error instanceof Error) {
        alert(`Failed to save reflection: ${error.message}`);
      } else {
        alert('Failed to save reflection: Unknown error');
      }
    }
  };

  const moodData = [
    { day: 'Mon', mood: getMoodForDay(0) },
    { day: 'Tue', mood: getMoodForDay(1) },
    { day: 'Wed', mood: getMoodForDay(2) },
    { day: 'Thu', mood: getMoodForDay(3) },
    { day: 'Fri', mood: getMoodForDay(4) },
    { day: 'Sat', mood: getMoodForDay(5) },
    { day: 'Sun', mood: getMoodForDay(6) },
  ];

  // Show loading only if we're actively loading and have a user
  if (loading && user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-center text-gray-600">Loading your journal entries...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Page Title */}
      <div className="text-center">
        <h1>Weekly Reflection</h1>
        <p className="text-sm text-gray-500 mt-1">Review your week with SmartJournal</p>
      </div>

      {/* Week Info */}
      <Card className="p-4 bg-white/80 backdrop-blur">
        <p className="text-center text-gray-600">📅 Week of {getWeekRange()}</p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50">
          <div className="text-sm text-gray-600">📝 Journal Entries</div>
          <div className="mt-1">{entries.length}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="text-sm text-gray-600">🙏 Gratitude Notes</div>
          <div className="mt-1">{entries.length}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-sm text-gray-600">😌 Moods Tracked</div>
          <div className="mt-1">{entries.filter(e => e.mood).length}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-sm text-gray-600">🔥 Current Streak</div>
          <div className="mt-1">{streak} days</div>
        </Card>
      </div>

      {/* Mood Over Time */}
      <Card className="p-6 bg-white/80 backdrop-blur">
        <h2 className="mb-4">📊 Mood Over Time</h2>
        <div className="flex justify-around items-end h-32">
          {moodData.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className="text-2xl">{item.mood || '😐'}</div>
              <div className="text-xs text-gray-500">{item.day}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Highlights */}
      <Card className="p-6 bg-white/80 backdrop-blur">
        <h2 className="mb-4">💬 Highlights of the Week</h2>
        {getHighlights().length > 0 ? (
          <ul className="space-y-2 text-gray-700">
            {getHighlights().map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span>•</span>
                <span>"{highlight}"</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No highlights yet this week</p>
        )}
      </Card>

      {/* Reflection Prompt */}
      <Card className="p-6 bg-white/80 backdrop-blur">
        <h2 className="mb-4">💭 Reflection Prompt</h2>
        <p className="text-gray-600 mb-3">"What made you happiest this week?"</p>
        <Textarea
          placeholder="Write your reflection here..."
          className="min-h-[100px] resize-none"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
        />
      </Card>

      {/* AI Insight */}
      <Card className="p-6 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 border-none">
        <div className="flex justify-between items-center mb-2">
          <h2 className="mb-0">✨ AI Insight</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateInsight}
            disabled={insightLoading || entries.length === 0}
          >
            {insightLoading ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>
        <p className="text-gray-700 italic">
          {insightLoading ? "Analyzing your week..." : aiInsight}
        </p>
      </Card>

      {/* Save Button */}
      <Button
        className="w-full bg-purple-600 hover:bg-purple-700"
        onClick={handleSaveReflection}
        disabled={!reflection.trim()}
      >
        Save Reflection
      </Button>
    </div>
  );
}
