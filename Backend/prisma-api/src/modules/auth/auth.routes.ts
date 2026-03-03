import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import * as authController from './auth.controller';

const router = Router();

// Public routes (ไม่ต้อง login)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (ต้อง login)
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;
