import { ChevronLeft, ChevronRight, Heart, Bell } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useState } from 'react';

export default function AffirmationsPage() {
  const affirmations = [
    { emoji: '🌷', text: 'I am growing stronger every day.' },
    { emoji: '💫', text: 'My thoughts are calm, my heart is open.' },
    { emoji: '🌿', text: 'Progress, not perfection.' },
    { emoji: '✨', text: 'I trust the journey I am on.' },
    { emoji: '🌸', text: 'I am worthy of love and happiness.' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextAffirmation = () => {
    setCurrentIndex((prev) => (prev + 1) % affirmations.length);
  };

  const prevAffirmation = () => {
    setCurrentIndex((prev) => (prev - 1 + affirmations.length) % affirmations.length);
  };

  const favorites = [
    'I trust myself.',
    'I am enough.',
    'Peace starts here.',
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1>💫 Affirmations</h1>
        <p className="text-gray-600 italic">
          💬 "Speak kindly to yourself — you are listening."
        </p>
        <p className="text-xs text-gray-400">SmartJournal</p>
      </div>

      {/* Main Affirmation Card */}
      <Card className="p-8 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 border-none min-h-[300px] flex flex-col items-center justify-center">
        <div className="flex items-center justify-between w-full max-w-lg">
          <button
            onClick={prevAffirmation}
            className="text-gray-600 hover:text-gray-900 p-2"
          >
            <ChevronLeft size={32} />
          </button>

          <div className="flex-1 text-center space-y-4">
            <div className="text-6xl">{affirmations[currentIndex].emoji}</div>
            <p className="text-xl text-gray-800 px-4">
              {affirmations[currentIndex].text}
            </p>
          </div>

          <button
            onClick={nextAffirmation}
            className="text-gray-600 hover:text-gray-900 p-2"
          >
            <ChevronRight size={32} />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex gap-2 mt-6">
          {affirmations.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button className="flex-1 bg-pink-600 hover:bg-pink-700">
          <Heart size={18} className="mr-2" />
          Save to Favorites
        </Button>
        <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
          <Bell size={18} className="mr-2" />
          Set Daily Reminder
        </Button>
      </div>

      {/* Categories */}
      <Card className="p-5 bg-white/90 backdrop-blur">
        <h2 className="mb-3">🧘 Categories</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="bg-purple-50">Self-Worth</Button>
          <Button variant="outline" size="sm">Calm</Button>
          <Button variant="outline" size="sm">Motivation</Button>
          <Button variant="outline" size="sm">Confidence</Button>
          <Button variant="outline" size="sm">Gratitude</Button>
        </div>
      </Card>

      {/* Favorites Section */}
      <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
        <h2 className="mb-4">⭐ Favorites</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {favorites.map((fav, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 bg-white rounded-lg p-4 min-w-[200px] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <p className="text-sm text-gray-700 text-center">"{fav}"</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Swipe Hint */}
      <p className="text-center text-xs text-gray-500">
        🔄 Swipe ➡️ / ⬅️ to view more affirmations
      </p>
    </div>
  );
}
