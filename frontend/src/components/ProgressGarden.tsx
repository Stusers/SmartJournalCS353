import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { journalApi, achievementApi, userApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { JournalEntry, Achievement } from 'shared';

export default function ProgressGarden() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [entriesData, achievementsData, statsData] = await Promise.all([
        journalApi.getByUserId(user!.id, 30),
        achievementApi.getUserAchievements(user!.id),
        userApi.getStats(user!.id)
      ]);

      setEntries(entriesData);
      setAchievements(achievementsData);
      setStreak(statsData.current_streak);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const plantEmojis = ['🌷', '🌻', '🌵', '🌸', '🌼', '🌺', '🌿', '🌹', '🌱', '🪴'];

  const getPlantForEntry = (entry: JournalEntry, index: number) => {
    return plantEmojis[index % plantEmojis.length];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌞 Good Morning';
    if (hour < 18) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1>🌿 Progress Garden</h1>
        <p className="text-gray-600">🌼 "Every entry helps your garden grow."</p>
        <p className="text-xs text-gray-400">SmartJournal</p>
      </div>

      {/* Current Time */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{getGreeting()}</span>
        <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      {/* Garden Grid */}
      <Card className="p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="grid grid-cols-5 gap-4 place-items-center min-h-[300px]">
          {entries.slice(0, 20).map((entry, idx) => (
            <button
              key={entry.id}
              className="text-5xl hover:scale-110 transition-transform cursor-pointer"
              title={entry.gratitude_text}
              onClick={() => setSelectedEntry(entry)}
            >
              {getPlantForEntry(entry, idx)}
            </button>
          ))}
        </div>
      </Card>

      {/* Plant Info */}
      {selectedEntry && (
        <Card className="p-6 bg-white/80 backdrop-blur">
          <h2 className="mb-3">🪴 Entry Details:</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span>📅</span>
              <span>{new Date(selectedEntry.entry_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>💬</span>
              <span>"{selectedEntry.gratitude_text}"</span>
            </li>
            {selectedEntry.mood && (
              <li className="flex items-start gap-2">
                <span>😊</span>
                <span>Mood: {selectedEntry.mood}</span>
              </li>
            )}
          </ul>
        </Card>
      )}

      {/* Streak Card */}
      <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">🎯 Your Streak</div>
            <div className="text-2xl mt-1">{streak} days 🌤️</div>
          </div>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus size={18} className="mr-2" />
            💧 Water Garden
          </Button>
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-6 bg-white/80 backdrop-blur">
        <h2 className="mb-4">🏅 Achievements</h2>
        <div className="flex flex-wrap gap-3">
          {achievements.length > 0 ? (
            achievements.map((achievement) => (
              <Badge
                key={achievement.id}
                className="bg-purple-100 text-purple-700 px-4 py-2 border border-purple-300"
              >
                {achievement.badge_emoji || '🏆'} {achievement.name}
              </Badge>
            ))
          ) : (
            <>
              <Badge className="bg-green-100 text-green-700 px-4 py-2 border border-green-300">
                🌱 Garden Started
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 px-4 py-2 border border-blue-300">
                ✍️ First Entry
              </Badge>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
