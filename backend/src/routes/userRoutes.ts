import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { clerkAuth } from '../middleware/clerkAuth.js';

const router = Router();

// User routes require authentication (except create, which is handled by Clerk)
router.get('/users/me', clerkAuth, userController.getCurrentUser);
router.get('/users/me/stats', clerkAuth, userController.getUserStats);
// Remove password/email update routes as Clerk handles this
// Remove delete route or protect it with additional checks

export default router;
