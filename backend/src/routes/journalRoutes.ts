import { Router } from 'express';
import * as journalController from '../controllers/journalController.js';
import { clerkAuth } from '../middleware/clerkAuth.js';

const router = Router();

// All journal routes require authentication
router.use(clerkAuth);

router.post('/entries', journalController.createEntry);
router.get('/entries/:id', journalController.getEntryById);
router.put('/entries/:id', journalController.updateEntry);
router.delete('/entries/:id', journalController.deleteEntry);

router.get('/users/me/entries', journalController.getUserEntries);
router.get('/users/me/entries/range', journalController.getEntriesByDateRange);
router.get('/users/me/entries/search', journalController.searchEntries);
router.get('/users/me/entries/tag/:tag', journalController.getEntriesByTag);
router.get('/users/me/entries/mood/:mood', journalController.getEntriesByMood);

export default router;
