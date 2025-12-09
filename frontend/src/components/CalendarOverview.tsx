import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Calendar } from './ui/calendar';
import { useApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { JournalEntry } from 'shared';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function CalendarOverview() {
  const { user } = useAuth();
  const { journalApi } = useApi();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const loadMonthEntries = async (monthDate: Date) => {
    if (!user) return;
    try {
      const start = startOfMonth(monthDate).toISOString();
      const end = endOfMonth(monthDate).toISOString();
      const data = await journalApi.getEntriesByDateRange(user.id, start, end);
      setEntries(data || []);
    } catch (error) {
      console.error('Failed to load calendar entries:', error);
      setEntries([]);
    }
  };

  useEffect(() => {
    loadMonthEntries(currentMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, currentMonth]);

  const hasEntry = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return entries.some(e => {
      const entryDate = new Date(e.entry_date);
      return format(entryDate, 'yyyy-MM-dd') === dateStr;
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1>📅 Calendar Tracker</h1>
        <p className="text-gray-600">See your consistence and patterns at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 flex justify-center bg-white/50 backdrop-blur">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            onMonthChange={setCurrentMonth}
            modifiers={{
              hasEntry: (date) => hasEntry(date)
            }}
            modifiersClassNames={{
              hasEntry: "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-purple-500 after:rounded-full"
            }}
          />
        </Card>

        {/* Selected Day Detail */}
        <Card className="p-6 bg-white/80 backdrop-blur">
          <h2 className="mb-4 text-xl font-semibold">
            {date ? format(date, 'MMMM do, yyyy') : 'Select a date'}
          </h2>
          {date ? (
            (() => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayEntries = entries.filter(e => {
                const entryDate = new Date(e.entry_date);
                return format(entryDate, 'yyyy-MM-dd') === dateStr;
              });

              if (dayEntries.length > 0) {
                return (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 max-h-[500px] overflow-y-auto pr-2">
                    <p className="text-sm text-gray-500 mb-2">Found {dayEntries.length} entries</p>
                    {dayEntries.map((entry) => (
                      <div key={entry.id} className="p-4 bg-purple-50 rounded-lg border border-purple-100 shadow-sm mb-3">
                        {entry.gratitude_text && (
                          <p className="text-lg text-gray-800 leading-relaxed mb-3">"{entry.gratitude_text}"</p>
                        )}
                        <div className="flex gap-2 flex-wrap items-center">
                          {entry.mood && (
                            <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-purple-200 text-xs shadow-sm" title={entry.mood}>
                              <span className="text-xl leading-none">
                                {(() => {
                                  const m = entry.mood;
                                  if (/\p{Emoji}/u.test(m) && m.length < 5) return m;
                                  const map: Record<string, string> = {
                                    'Happy': '😊', 'Excited': '🤩', 'Grateful': '🙏',
                                    'Calm': '😌', 'Relaxed': '😌', 'Productive': '🚀',
                                    'Energetic': '⚡', 'Tired': '😴', 'Stressed': '😓',
                                    'Sad': '😢', 'Anxious': '😰', 'Angry': '😡', 'Neutral': '😐'
                                  };
                                  return map[m] || map[m.charAt(0).toUpperCase() + m.slice(1)] || '😐';
                                })()}
                              </span>
                            </span>
                          )}
                          <span className="text-xs text-gray-400 ml-auto block">
                            {new Date(entry.created_at || entry.entry_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {entry.tags.map(tag => (
                              <span key={tag} className="text-xs bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-500">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div className="text-center py-10">
                    <p className="text-gray-500 italic mb-4">No entries for this day.</p>
                    <p className="text-sm text-gray-400">Go to Journal to add one!</p>
                  </div>
                );
              }
            })()
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Pick a day on the calendar to see details.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
