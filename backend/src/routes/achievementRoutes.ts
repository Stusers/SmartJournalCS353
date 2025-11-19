import { Router } from 'express';
import * as achievementController from '../controllers/achievementController.js';
import { clerkAuth } from '../middleware/clerkAuth.js';

const router = Router();

// Public endpoint for all achievements
router.get('/achievements', achievementController.getAllAchievements);

// User-specific achievement routes require authentication
router.get('/users/me/achievements', clerkAuth, achievementController.getUserAchievements);
router.get('/users/me/achievements/progress', clerkAuth, achievementController.getUserAchievementProgress);

export default router;
