import { Router } from 'express';
import { analyzeReflection } from '../controllers/aiController.js';
import { clerkAuth as authenticateToken } from '../middleware/clerkAuth.js';

const router = Router();

// Protected route to analyze journal entries
router.post('/analyze', authenticateToken, analyzeReflection);

export default router;
