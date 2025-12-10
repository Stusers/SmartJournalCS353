import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { moodToEmoji } from '../lib/utils';
import type { JournalEntry } from 'shared';

export default function GratitudeWall() {
  const { user } = useAuth();
  const { journalApi } = useApi();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
  const [newEntryText, setNewEntryText] = useState('');
  const [newEntryMood, setNewEntryMood] = useState('🧡');
  const [searchTerm, setSearchTerm] = useState('');

  const loadEntries = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await journalApi.getByUserId(user.id, 50);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load gratitude entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleCreateEntry = async () => {
    if (!user || !newEntryText.trim()) return;

    try {
      await journalApi.create(user.id, newEntryText, newEntryMood, ['gratitude']);
      setNewEntryText('');
      setShowNewEntryDialog(false);
      loadEntries();
    } catch (error) {
      console.error('Failed to create entry:', error);
      alert('Failed to save gratitude entry');
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.gratitude_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const moodOptions = ['🧡', '💚', '💜', '💛', '💙', '❤️', '✨', '🌿'];

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case '🧡': return '#fb923c';
      case '💚': return '#4ade80';
      case '💜': return '#c084fc';
      case '💛': return '#fbbf24';
      case '💙': return '#60a5fa';
      default: return '#94a3b8';
    }
  };

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

      {/* Actions Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search moments..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={showNewEntryDialog} onOpenChange={setShowNewEntryDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus size={20} className="mr-2" />
              Add Gratitude
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Gratitude Moment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">What are you grateful for?</label>
                <Textarea
                  placeholder="I am grateful for..."
                  value={newEntryText}
                  onChange={(e) => setNewEntryText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pick a mood/vibe:</label>
                <div className="flex gap-2 flex-wrap">
                  {moodOptions.map(mood => (
                    <button
                      key={mood}
                      onClick={() => setNewEntryMood(mood)}
                      className={`text-2xl p-2 rounded-full hover:bg-gray-100 transition-colors ${newEntryMood === mood ? 'bg-purple-100' : ''}`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateEntry} disabled={!newEntryText.trim()}>Save Moment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gratitude Cards */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading gratitude moments...</p>
        ) : filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <Card
              key={entry.id}
              className="p-4 bg-white/90 backdrop-blur hover:shadow-lg transition-all border-l-4"
              style={{
                borderLeftColor: getMoodColor(entry.mood)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{moodToEmoji(entry.mood || '')}</span>
                    <p className="text-gray-800">{entry.gratitude_text}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{new Date(entry.entry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-white/50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500">No gratitude moments found yet.</p>
            <Button variant="link" onClick={() => setShowNewEntryDialog(true)}>Add your first one!</Button>
          </div>
        )}
      </div>
    </div>
  );
}
