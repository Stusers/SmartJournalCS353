import { ChevronLeft, ChevronRight, Heart, Bell, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api';
import type { DailyPrompt } from 'shared';

export default function AffirmationsPage() {
  const { promptApi } = useApi();
  const [affirmations, setAffirmations] = useState<DailyPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('affirmation_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    const loadPrompts = async () => {
      try {
        setLoading(true);
        const data = await promptApi.getAll();
        if (data && data.length > 0) {
          setAffirmations(data);
        } else {
          // Fallback content if API returns empty
          setAffirmations([
            { id: 1, prompt_text: "You are doing great.", created_at: new Date() },
            { id: 2, prompt_text: "Today is a new opportunity.", created_at: new Date() }
          ]);
        }
      } catch (error) {
        console.error('Failed to load prompts:', error);
        // Fallback content on error
        setAffirmations([
          { id: 1, prompt_text: "You are capable of amazing things.", created_at: new Date() },
          { id: 2, prompt_text: "Believe in yourself.", created_at: new Date() }
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextAffirmation = () => {
    if (affirmations.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % affirmations.length);
  };

  const prevAffirmation = () => {
    if (affirmations.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + affirmations.length) % affirmations.length);
  };

  const currentAffirmation = affirmations[currentIndex];

  const handleToggleFavorite = () => {
    if (!currentAffirmation) return;

    const text = currentAffirmation.prompt_text;
    let newFavorites;

    if (favorites.includes(text)) {
      newFavorites = favorites.filter(f => f !== text);
    } else {
      newFavorites = [...favorites, text];
    }

    setFavorites(newFavorites);
    localStorage.setItem('affirmation_favorites', JSON.stringify(newFavorites));
  };

  const handleSetReminder = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification("Daily Affirmation Reminder Set!");
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("Daily Affirmation Reminder Set!");
      }
    }
  };

  const removeFavorite = (text: string) => {
    const newFavorites = favorites.filter(f => f !== text);
    setFavorites(newFavorites);
    localStorage.setItem('affirmation_favorites', JSON.stringify(newFavorites));
  };

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
        {loading ? (
          <p className="text-gray-500">Loading affirmations...</p>
        ) : currentAffirmation ? (
          <>
            <div className="flex items-center justify-between w-full max-w-lg">
              <button
                onClick={prevAffirmation}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                <ChevronLeft size={32} />
              </button>

              <div className="flex-1 text-center space-y-4">
                <div className="text-6xl">✨</div>
                <p className="text-xl text-gray-800 px-4 font-medium leading-relaxed">
                  "{currentAffirmation.prompt_text}"
                </p>
                {currentAffirmation.category && (
                  <span className="inline-block text-xs bg-white/50 px-2 py-1 rounded-full text-gray-500 uppercase tracking-wider">{currentAffirmation.category}</span>
                )}
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
              {affirmations.slice(0, 10).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500">No affirmations available.</p>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          className="flex-1 bg-pink-600 hover:bg-pink-700"
          onClick={handleToggleFavorite}
          disabled={!currentAffirmation}
        >
          <Heart
            size={18}
            className={`mr-2 ${currentAffirmation && favorites.includes(currentAffirmation.prompt_text) ? 'fill-current' : ''}`}
          />
          {currentAffirmation && favorites.includes(currentAffirmation.prompt_text) ? 'Saved' : 'Save to Favorites'}
        </Button>
        <Button
          className="flex-1 bg-purple-600 hover:bg-purple-700"
          onClick={handleSetReminder}
        >
          <Bell size={18} className="mr-2" />
          Set Daily Reminder
        </Button>
      </div>

      {/* Favorites Section */}
      <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
        <h2 className="mb-4">⭐ Favorites</h2>
        {favorites.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {favorites.map((fav, idx) => (
              <div
                key={idx}
                className="relative flex-shrink-0 bg-white rounded-lg p-4 min-w-[200px] shadow-sm hover:shadow-md transition-shadow group"
              >
                <button
                  onClick={() => removeFavorite(fav)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
                <p className="text-sm text-gray-700 text-center mt-2">"{fav}"</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic text-center">Save affirmations here to revisit them later.</p>
        )}
      </Card>

      {/* Swipe Hint */}
      <p className="text-center text-xs text-gray-500">
        🔄 Swipe ➡️ / ⬅️ to view more affirmations
      </p>
    </div>
  );
}
