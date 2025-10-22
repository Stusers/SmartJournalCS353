import { Request, Response } from 'express';
import * as journalDb from '../db/functions/journalEntries.js';
import * as streakDb from '../db/functions/streaks.js';
import * as achievementDb from '../db/functions/achievements.js';

export async function createEntry(req: Request, res: Response) {
  try {
    const { user_id, entry_date, gratitude_text, mood, tags, is_private } = req.body;

    if (!user_id || !entry_date || !gratitude_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingEntry = await journalDb.getJournalEntryByUserAndDate(user_id, new Date(entry_date));
    if (existingEntry) {
      return res.status(409).json({ error: 'Entry already exists for this date' });
    }

    const entry = await journalDb.createJournalEntry({
      user_id,
      entry_date: new Date(entry_date),
      gratitude_text,
      mood,
      tags,
      is_private,
    });

    await streakDb.updateStreakAfterEntry(user_id, new Date(entry_date));
    const newAchievements = await achievementDb.checkAndGrantAchievements(user_id);

    res.status(201).json({
      entry,
      new_achievements: newAchievements,
    });
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getEntryById(req: Request, res: Response) {
  try {
    const entryId = parseInt(req.params.id);
    const entry = await journalDb.getJournalEntryById(entryId);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserEntries(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const entries = await journalDb.getUserJournalEntries(userId, limit, offset);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching user entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getEntriesByDateRange(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Missing start_date or end_date' });
    }

    const entries = await journalDb.getUserEntriesByDateRange(
      userId,
      new Date(start_date as string),
      new Date(end_date as string)
    );

    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries by date range:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateEntry(req: Request, res: Response) {
  try {
    const entryId = parseInt(req.params.id);
    const updates = req.body;

    const entry = await journalDb.updateJournalEntry(entryId, updates);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteEntry(req: Request, res: Response) {
  try {
    const entryId = parseInt(req.params.id);
    const success = await journalDb.deleteJournalEntry(entryId);

    if (!success) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function searchEntries(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const searchTerm = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!searchTerm) {
      return res.status(400).json({ error: 'Missing search term' });
    }

    const entries = await journalDb.searchUserEntries(userId, searchTerm, limit);
    res.json(entries);
  } catch (error) {
    console.error('Error searching entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getEntriesByTag(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const tag = req.params.tag;
    const limit = parseInt(req.query.limit as string) || 50;

    const entries = await journalDb.getUserEntriesByTag(userId, tag, limit);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries by tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getEntriesByMood(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const mood = req.params.mood;
    const limit = parseInt(req.query.limit as string) || 50;

    const entries = await journalDb.getUserEntriesByMood(userId, mood, limit);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries by mood:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
