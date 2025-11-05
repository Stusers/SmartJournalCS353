import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { journalApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { JournalEntry } from 'shared';

export default function CalendarOverview() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user, currentMonth]);

  const loadEntries = async () => {
    try {
      const allEntries = await journalApi.getByUserId(user!.id, 100);
      setEntries(allEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  const getEntryForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return entries.find(e => e.entry_date === dateStr);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 35; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = generateCalendarDays();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1>📅 Calendar Overview</h1>
        <p className="text-xs text-gray-400">Track your mood timeline with SmartJournal</p>
      </div>

      {/* Month Selector */}
      <Card className="p-4 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="text-gray-600 hover:text-gray-900">◀</button>
          <h2>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={nextMonth} className="text-gray-600 hover:text-gray-900">▶</button>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="p-4 bg-white/90 backdrop-blur">
        <div className="grid grid-cols-7 gap-2 text-center">
          {/* Day Headers */}
          {days.map((day) => (
            <div key={day} className="text-xs text-gray-500 py-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((date, idx) => {
            const entry = getEntryForDate(date);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

            return (
              <div
                key={idx}
                onClick={() => entry && setSelectedEntry(entry)}
                className={`aspect-square flex items-center justify-center text-2xl rounded-lg hover:bg-purple-50 transition-colors ${
                  entry ? 'bg-white border border-gray-200 cursor-pointer' : ''
                } ${!isCurrentMonth ? 'opacity-30' : ''}`}
              >
                {entry?.mood || ''}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-600 justify-center flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          <span>Journal Entry Logged</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <span>Gratitude Added</span>
        </div>
      </div>

      {/* Selected Day Summary */}
      {selectedEntry && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
          <h2 className="mb-4">🪞 Summary for {new Date(selectedEntry.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h2>
          <div className="space-y-2 text-gray-700">
            <div className="flex items-center gap-2">
              <span>Mood:</span>
              <span>{selectedEntry.mood} {selectedEntry.mood ? 'Good' : 'N/A'}</span>
            </div>
            <p className="mt-3 italic text-gray-600">
              "{selectedEntry.gratitude_text}"
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
