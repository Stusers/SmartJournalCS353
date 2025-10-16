import { Router } from 'express';
import * as journalController from '../controllers/journalController.js';

const router = Router();

router.post('/entries', journalController.createEntry);
router.get('/entries/:id', journalController.getEntryById);
router.put('/entries/:id', journalController.updateEntry);
router.delete('/entries/:id', journalController.deleteEntry);

router.get('/users/:userId/entries', journalController.getUserEntries);
router.get('/users/:userId/entries/range', journalController.getEntriesByDateRange);
router.get('/users/:userId/entries/search', journalController.searchEntries);
router.get('/users/:userId/entries/tag/:tag', journalController.getEntriesByTag);
router.get('/users/:userId/entries/mood/:mood', journalController.getEntriesByMood);

export default router;
