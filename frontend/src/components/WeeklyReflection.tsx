import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { JournalEntry } from 'shared';

export default function WeeklyReflection() {
  const { user } = useAuth();
  const { journalApi } = useApi();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(false);

  const loadWeeklyEntries = async () => {
    if (!user) {
      setLoading(false);
      setEntries([]);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Loading weekly entries for user:', user.id);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });
      
      const entriesPromise = journalApi.getByUserId(user.id, 50);
      const allEntries = await Promise.race([entriesPromise, timeoutPromise]);
      
      console.log('Entries loaded:', allEntries.length);

      // Get last 7 days of entries
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const weeklyEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        return entryDate >= sevenDaysAgo;
      });

      setEntries(weeklyEntries);
    } catch (error: any) {
      console.error('Failed to load weekly entries:', error);
      console.error('Error details:', error.message, error.stack);
      setEntries([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadWeeklyEntries();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id to avoid re-running unnecessarily

  const getMoodForDay = (dayOffset: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (6 - dayOffset));
    const dateStr = targetDate.toISOString().split('T')[0];

    const entry = entries.find(e => e.entry_date === dateStr);
    return entry?.mood || '';
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
    if (!reflection.trim() || !user) return;

    try {
      await journalApi.create(user.id, reflection, undefined, ['reflection']);
      setReflection('');
      loadWeeklyEntries(); // Reload entries
      alert('Reflection saved successfully!');
    } catch (error) {
      console.error('Failed to save reflection:', error);
      alert('Failed to save reflection');
    }
  };

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
          <div className="mt-1">{entries.length} days</div>
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
        <h2 className="mb-2">✨ AI Insight</h2>
        <p className="text-gray-700 italic">
          {entries.length > 0
            ? `You've been actively journaling! ${entries.length} entries this week shows great commitment.`
            : "Start journaling to see personalized insights about your patterns."}
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
