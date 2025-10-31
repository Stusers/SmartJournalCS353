import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { journalApi, promptApi } from '../lib/api';
import type { DailyPrompt, Achievement } from 'shared';

interface JournalFormProps {
  onEntryCreated: () => void;
}

export function JournalForm({ onEntryCreated }: JournalFormProps) {
  const { user } = useAuth();
  const [gratitudeText, setGratitudeText] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [prompt, setPrompt] = useState<DailyPrompt | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadRandomPrompt();
  }, []);

  const loadRandomPrompt = async () => {
    try {
      const randomPrompt = await promptApi.getRandom();
      setPrompt(randomPrompt);
    } catch (err) {
      console.error('[JournalForm] Failed to load prompt:', err);
      // Don't show error to user for prompt loading - it's not critical
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setNewAchievements([]);
    setLoading(true);

    try {
      const tagArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      console.log('[JournalForm] Creating entry for user:', user.id);
      const result = await journalApi.create(
        user.id,
        gratitudeText,
        mood || undefined,
        tagArray.length > 0 ? tagArray : undefined
      );

      console.log('[JournalForm] Entry created successfully:', result);
      setSuccess('Journal entry created successfully!');
      setGratitudeText('');
      setMood('');
      setTags('');

      if (result.new_achievements.length > 0) {
        setNewAchievements(result.new_achievements);
        console.log('[JournalForm] New achievements unlocked:', result.new_achievements);
      }

      onEntryCreated();
      loadRandomPrompt();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to create entry. Please try again.';

      console.error('[JournalForm] Error creating entry:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="journal-form-container">
      <h2>Create Journal Entry</h2>

      {prompt && (
        <div className="prompt-box">
          <p className="prompt-label">Today's Prompt:</p>
          <p className="prompt-text">{prompt.prompt_text}</p>
          {prompt.category && <span className="prompt-category">{prompt.category}</span>}
          <button onClick={loadRandomPrompt} className="btn-small">
            🔄 New Prompt
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {newAchievements.length > 0 && (
        <div className="achievement-popup">
          <h3>🎉 New Achievement{newAchievements.length > 1 ? 's' : ''} Unlocked!</h3>
          {newAchievements.map(achievement => (
            <div key={achievement.id} className="achievement-item">
              <span className="achievement-icon">{achievement.icon || '🏆'}</span>
              <div>
                <strong>{achievement.name}</strong>
                {achievement.description && <p>{achievement.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="journal-form">
        <div className="form-group">
          <label htmlFor="gratitude">What are you grateful for today?</label>
          <textarea
            id="gratitude"
            value={gratitudeText}
            onChange={(e) => setGratitudeText(e.target.value)}
            placeholder="Write about something you're grateful for..."
            required
            rows={5}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mood">Mood (optional)</label>
            <select
              id="mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            >
              <option value="">Select mood...</option>
              <option value="happy">😊 Happy</option>
              <option value="grateful">🙏 Grateful</option>
              <option value="peaceful">😌 Peaceful</option>
              <option value="excited">🤩 Excited</option>
              <option value="content">😊 Content</option>
              <option value="reflective">🤔 Reflective</option>
              <option value="sad">😢 Sad</option>
              <option value="anxious">😰 Anxious</option>
              <option value="tired">😴 Tired</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (optional)</label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="family, work, health (comma-separated)"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
}
