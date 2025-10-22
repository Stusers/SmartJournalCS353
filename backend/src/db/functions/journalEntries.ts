import { query } from '../helpers.js';
import { JournalEntry, CreateJournalEntryInput, UpdateJournalEntryInput } from '../../types/index.js';

export async function createJournalEntry(input: CreateJournalEntryInput): Promise<JournalEntry> {
  const { user_id, entry_date, gratitude_text, mood, tags, is_private = false } = input;

  const result = await query<JournalEntry>(
    `INSERT INTO journal_entries (user_id, entry_date, gratitude_text, mood, tags, is_private)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, entry_date, gratitude_text, mood, tags, is_private]
  );

  return result.rows[0];
}

export async function getJournalEntryById(entryId: number): Promise<JournalEntry | null> {
  const result = await query<JournalEntry>(
    'SELECT * FROM journal_entries WHERE id = $1',
    [entryId]
  );

  return result.rows[0] || null;
}

export async function getJournalEntryByUserAndDate(userId: number, date: Date): Promise<JournalEntry | null> {
  const result = await query<JournalEntry>(
    'SELECT * FROM journal_entries WHERE user_id = $1 AND entry_date = $2',
    [userId, date]
  );

  return result.rows[0] || null;
}

export async function getUserJournalEntries(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<JournalEntry[]> {
  const result = await query<JournalEntry>(
    `SELECT * FROM journal_entries
     WHERE user_id = $1
     ORDER BY entry_date DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows;
}

export async function getUserEntriesByDateRange(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<JournalEntry[]> {
  const result = await query<JournalEntry>(
    `SELECT * FROM journal_entries
     WHERE user_id = $1 AND entry_date BETWEEN $2 AND $3
     ORDER BY entry_date DESC`,
    [userId, startDate, endDate]
  );

  return result.rows;
}

export async function updateJournalEntry(
  entryId: number,
  updates: UpdateJournalEntryInput
): Promise<JournalEntry | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.gratitude_text !== undefined) {
    fields.push(`gratitude_text = $${paramCount}`);
    values.push(updates.gratitude_text);
    paramCount++;
  }
  if (updates.mood !== undefined) {
    fields.push(`mood = $${paramCount}`);
    values.push(updates.mood);
    paramCount++;
  }
  if (updates.tags !== undefined) {
    fields.push(`tags = $${paramCount}`);
    values.push(updates.tags);
    paramCount++;
  }
  if (updates.is_private !== undefined) {
    fields.push(`is_private = $${paramCount}`);
    values.push(updates.is_private);
    paramCount++;
  }

  if (fields.length === 0) {
    return getJournalEntryById(entryId);
  }

  values.push(entryId);

  const result = await query<JournalEntry>(
    `UPDATE journal_entries SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

export async function deleteJournalEntry(entryId: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM journal_entries WHERE id = $1',
    [entryId]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function getUserEntryCount(userId: number): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM journal_entries WHERE user_id = $1',
    [userId]
  );

  return parseInt(result.rows[0].count);
}

export async function searchUserEntries(
  userId: number,
  searchTerm: string,
  limit: number = 50
): Promise<JournalEntry[]> {
  const result = await query<JournalEntry>(
    `SELECT * FROM journal_entries
     WHERE user_id = $1 AND gratitude_text ILIKE $2
     ORDER BY entry_date DESC
     LIMIT $3`,
    [userId, `%${searchTerm}%`, limit]
  );

  return result.rows;
}

export async function getUserEntriesByTag(
  userId: number,
  tag: string,
  limit: number = 50
): Promise<JournalEntry[]> {
  const result = await query<JournalEntry>(
    `SELECT * FROM journal_entries
     WHERE user_id = $1 AND $2 = ANY(tags)
     ORDER BY entry_date DESC
     LIMIT $3`,
    [userId, tag, limit]
  );

  return result.rows;
}

export async function getUserEntriesByMood(
  userId: number,
  mood: string,
  limit: number = 50
): Promise<JournalEntry[]> {
  const result = await query<JournalEntry>(
    `SELECT * FROM journal_entries
     WHERE user_id = $1 AND mood = $2
     ORDER BY entry_date DESC
     LIMIT $3`,
    [userId, mood, limit]
  );

  return result.rows;
}
