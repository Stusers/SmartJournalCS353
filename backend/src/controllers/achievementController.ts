import { Request, Response } from 'express';
import * as achievementDb from '../db/functions/achievements.js';

export async function getAllAchievements(req: Request, res: Response) {
  try {
    const achievements = await achievementDb.getAllAchievements();
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserAchievements(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const achievements = await achievementDb.getUserAchievements(userId);
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserAchievementProgress(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const progress = await achievementDb.getUserAchievementProgress(userId);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching achievement progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
