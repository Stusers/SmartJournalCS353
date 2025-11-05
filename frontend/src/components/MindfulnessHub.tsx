import { Play } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';

export default function MindfulnessHub() {
  const exercises = [
    { icon: '🌤️', title: 'Daily Reset', duration: '3 min', description: 'Short breathing animation + sound option' },
    { icon: '🌙', title: 'Evening Wind-Down', duration: '5 min', description: 'Gentle narration with ambient music' },
    { icon: '💭', title: 'Mindful Reflection', duration: '2 min', description: '"Notice three things you\'re grateful for."' },
    { icon: '🧘', title: 'Body Scan', duration: '7 min', description: 'Guided voice with progress bar' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1>🧘 Mindfulness Exercises</h1>
        <p className="text-gray-600 italic">
          💬 "A calm mind is the foundation of clarity."
        </p>
        <p className="text-xs text-gray-400">SmartJournal</p>
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
              <button className="bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full p-3 transition-colors">
                <Play size={20} fill="currentColor" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Progress Card */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">🔄 Completed Today</span>
            <span className="text-sm">2 / 3 Sessions ✅</span>
          </div>
          <Progress value={66} className="h-2" />
        </div>
      </Card>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-sm text-gray-600 mb-1">🎯 Current Streak</div>
          <div className="text-2xl">5 days</div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50">
          <div className="text-sm text-gray-600 mb-1">🌿 Longest Streak</div>
          <div className="text-2xl">12 days</div>
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
