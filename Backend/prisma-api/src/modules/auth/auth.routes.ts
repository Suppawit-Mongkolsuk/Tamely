import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import * as authController from './auth.controller';

const router = Router();

// Public routes (ไม่ต้อง login)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes (ต้อง login)
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

// Profile routes (ต้อง login)
router.patch('/profile', authenticate, authController.updateProfile);
router.post(
  '/avatar',
  authenticate,
  authController.avatarUpload.single('avatar'),
  authController.uploadAvatar,
);

export default router;
