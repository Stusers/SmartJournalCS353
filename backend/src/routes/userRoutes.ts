import { Router } from 'express';
import * as userController from '../controllers/userController.js';

const router = Router();

router.post('/users', userController.createUser);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id/email', userController.updateUserEmail);
router.put('/users/:id/password', userController.updateUserPassword);
router.delete('/users/:id', userController.deleteUser);
router.get('/users/:id/stats', userController.getUserStats);

export default router;
