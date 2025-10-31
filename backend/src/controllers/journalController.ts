import { Request, Response } from 'express';
import * as journalDb from '../db/functions/journalEntries.js';
import * as streakDb from '../db/functions/streaks.js';
import * as achievementDb from '../db/functions/achievements.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { HTTP_STATUS, ERROR_MESSAGES, PAGINATION } from '../config/constants.js';

export const createEntry = asyncHandler(async (req: Request, res: Response) => {
  const { user_id, entry_date, gratitude_text, mood, tags, is_private } = req.body;

  if (!user_id || !entry_date || !gratitude_text) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
  }

  const existingEntry = await journalDb.getJournalEntryByUserAndDate(user_id, new Date(entry_date));
  if (existingEntry) {
    throw new AppError(HTTP_STATUS.CONFLICT, 'Entry already exists for this date');
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

  res.status(HTTP_STATUS.CREATED).json({
    entry,
    new_achievements: newAchievements,
  });
});

export const getEntryById = asyncHandler(async (req: Request, res: Response) => {
  const entryId = parseInt(req.params.id);
  const entry = await journalDb.getJournalEntryById(entryId);

  if (!entry) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ENTRY_NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json(entry);
});

export const getUserEntries = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
  const offset = parseInt(req.query.offset as string) || PAGINATION.DEFAULT_OFFSET;

  const entries = await journalDb.getUserJournalEntries(userId, limit, offset);
  res.status(HTTP_STATUS.OK).json(entries);
});

export const getEntriesByDateRange = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Missing start_date or end_date');
  }

  const entries = await journalDb.getUserEntriesByDateRange(
    userId,
    new Date(start_date as string),
    new Date(end_date as string)
  );

  res.status(HTTP_STATUS.OK).json(entries);
});

export const updateEntry = asyncHandler(async (req: Request, res: Response) => {
  const entryId = parseInt(req.params.id);
  const updates = req.body;

  const entry = await journalDb.updateJournalEntry(entryId, updates);

  if (!entry) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ENTRY_NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json(entry);
});

export const deleteEntry = asyncHandler(async (req: Request, res: Response) => {
  const entryId = parseInt(req.params.id);
  const success = await journalDb.deleteJournalEntry(entryId);

  if (!success) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ENTRY_NOT_FOUND);
  }

  res.status(HTTP_STATUS.NO_CONTENT).send();
});

export const searchEntries = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const searchTerm = req.query.q as string;
  const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;

  if (!searchTerm) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Missing search term');
  }

  const entries = await journalDb.searchUserEntries(userId, searchTerm, limit);
  res.status(HTTP_STATUS.OK).json(entries);
});

export const getEntriesByTag = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const tag = req.params.tag;
  const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;

  const entries = await journalDb.getUserEntriesByTag(userId, tag, limit);
  res.status(HTTP_STATUS.OK).json(entries);
});

export const getEntriesByMood = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const mood = req.params.mood;
  const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;

  const entries = await journalDb.getUserEntriesByMood(userId, mood, limit);
  res.status(HTTP_STATUS.OK).json(entries);
});
