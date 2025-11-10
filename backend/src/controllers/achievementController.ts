import { Request, Response } from 'express';
import * as achievementDb from '../db/functions/achievements.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../config/constants.js';

export const getAllAchievements = asyncHandler(async (req: Request, res: Response) => {
  const achievements = await achievementDb.getAllAchievements();
  res.status(HTTP_STATUS.OK).json(achievements);
});

export const getUserAchievements = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!; // Set by clerkAuth middleware
  const achievements = await achievementDb.getUserAchievements(userId);
  res.status(HTTP_STATUS.OK).json(achievements);
});

export const getUserAchievementProgress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!; // Set by clerkAuth middleware
  const progress = await achievementDb.getUserAchievementProgress(userId);
  res.status(HTTP_STATUS.OK).json(progress);
});
