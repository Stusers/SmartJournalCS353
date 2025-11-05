import { Plus } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

export default function GratitudeWall() {
  const gratitudeEntries = [
    { text: 'Morning coffee and quiet time', emoji: '🧡', date: 'Oct 13', icon: '☀️' },
    { text: 'Friend checked in after class', emoji: '💚', date: 'Oct 12', icon: '🌿' },
    { text: 'Finished a big assignment!', emoji: '💜', date: 'Oct 11', icon: '✨' },
    { text: 'Walked in the park with my dog', emoji: '💛', date: 'Oct 10', icon: '🍃' },
    { text: 'Cooked a meal I\'m proud of', emoji: '💙', date: 'Oct 9', icon: '🍲' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1>🙏 Gratitude Wall</h1>
        <p className="text-gray-600 italic">
          "Gratitude turns what we have into enough."
        </p>
        <p className="text-xs text-gray-400">SmartJournal</p>
      </div>

      {/* Add Button */}
      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
        <Plus size={20} className="mr-2" />
        Add New Gratitude
      </Button>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-gray-600">🔍 Filter by:</span>
        <Button variant="outline" size="sm">All ▼</Button>
        <Button variant="outline" size="sm">People</Button>
        <Button variant="outline" size="sm">Nature</Button>
        <Button variant="outline" size="sm">Wins</Button>
      </div>

      {/* Gratitude Cards */}
      <div className="space-y-3">
        {gratitudeEntries.map((entry, idx) => (
          <Card
            key={idx}
            className="p-4 bg-white/90 backdrop-blur hover:shadow-lg transition-all cursor-pointer border-l-4"
            style={{
              borderLeftColor: entry.emoji === '🧡' ? '#fb923c' :
                               entry.emoji === '💚' ? '#4ade80' :
                               entry.emoji === '💜' ? '#c084fc' :
                               entry.emoji === '💛' ? '#fbbf24' : '#60a5fa'
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{entry.emoji}</span>
                  <p className="text-gray-800">{entry.text}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{entry.icon}</span>
                <span>{entry.date}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Image Grid Section */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-dashed border-2 border-purple-200">
        <p className="text-center text-gray-600">
          📷 Optional: Add photos to your gratitude moments
        </p>
      </Card>
    </div>
  );
}
