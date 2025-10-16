import { Router } from 'express';
import * as promptController from '../controllers/promptController.js';

const router = Router();

router.post('/prompts', promptController.createPrompt);
router.get('/prompts', promptController.getAllPrompts);
router.get('/prompts/random', promptController.getRandomPrompt);
router.get('/prompts/category/:category', promptController.getPromptsByCategory);
router.delete('/prompts/:id', promptController.deletePrompt);

export default router;
