import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { journalApi } from '../lib/api';
import type { JournalEntry } from 'shared';

interface JournalListProps {
  refreshTrigger: number;
}

export function JournalList({ refreshTrigger }: JournalListProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user, refreshTrigger]);

  const loadEntries = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      console.log('[JournalList] Loading entries for user:', user.id);
      const data = await journalApi.getByUserId(user.id, 50);
      console.log('[JournalList] Loaded entries:', data.length);
      setEntries(data);
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to load entries. Please try again.';

      console.error('[JournalList] Error loading entries:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !searchQuery.trim()) {
      loadEntries();
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[JournalList] Searching entries with query:', searchQuery);
      const data = await journalApi.search(user.id, searchQuery);
      console.log('[JournalList] Search results:', data.length);
      setEntries(data);
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Search failed. Please try again.';

      console.error('[JournalList] Search error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      console.log('[JournalList] Deleting entry:', entryId);
      await journalApi.delete(entryId);
      console.log('[JournalList] Entry deleted successfully');
      setEntries(entries.filter(e => e.id !== entryId));
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to delete entry. Please try again.';

      console.error('[JournalList] Error deleting entry:', err);
      alert('Failed to delete entry: ' + errorMessage);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && entries.length === 0) {
    return <div className="journal-list-container"><p>Loading entries...</p></div>;
  }

  return (
    <div className="journal-list-container">
      <div className="list-header">
        <h2>Journal Entries ({entries.length})</h2>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="search-input"
          />
          <button type="submit" className="btn-small">Search</button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadEntries();
              }}
              className="btn-small"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {entries.length === 0 ? (
        <div className="empty-state">
          <p>No journal entries yet.</p>
          <p>Create your first entry above!</p>
        </div>
      ) : (
        <div className="entries-list">
          {entries.map((entry) => (
            <div key={entry.id} className="entry-card">
              <div className="entry-header">
                <span className="entry-date">{formatDate(entry.entry_date)}</span>
                {entry.mood && (
                  <span className="entry-mood">{entry.mood}</span>
                )}
              </div>

              <div className="entry-content">
                <p>{entry.gratitude_text}</p>
              </div>

              {entry.tags && entry.tags.length > 0 && (
                <div className="entry-tags">
                  {entry.tags.map((tag, idx) => (
                    <span key={idx} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="entry-footer">
                <span className="entry-meta">
                  Created: {new Date(entry.created_at).toLocaleString()}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
