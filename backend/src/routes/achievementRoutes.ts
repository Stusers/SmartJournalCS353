import { Router } from 'express';
import * as achievementController from '../controllers/achievementController.js';

const router = Router();

router.get('/achievements', achievementController.getAllAchievements);
router.get('/users/:userId/achievements', achievementController.getUserAchievements);
router.get('/users/:userId/achievements/progress', achievementController.getUserAchievementProgress);

export default router;
