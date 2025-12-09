import { Router } from 'express';
import { resetDatabase } from '../controllers/devController.js';
import { clerkAuth as authenticateToken } from '../middleware/clerkAuth.js';

const router = Router();

// Protected route to reset database
router.post('/reset', authenticateToken, resetDatabase);

export default router;
