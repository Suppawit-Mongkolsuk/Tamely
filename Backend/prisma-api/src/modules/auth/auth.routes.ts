import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AuthRequest, LoginResponse } from '../../types';
import {
  signToken,
  setTokenCookie,
  clearTokenCookie,
  setAdminTokenCookie,
  clearAdminTokenCookie,
} from '../../utils/jwt.utils';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from './auth.model';
import * as authService from './auth.service';
import { avatarUpload } from '../../middlewares/upload.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRequest(RegisterSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await authService.registerUser(req.body);
  const token = signToken(user.id);
  setTokenCookie(res, token);
  const response: LoginResponse = { token, sessionType: 'user', user };
  res.status(201).json({ success: true, data: response });
}));

// POST /api/auth/login
router.post('/login', validateRequest(LoginSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await authService.loginUser(req.body);
  const rememberMe = Boolean(req.body.rememberMe);

  let response: LoginResponse;

  if (result.sessionType === 'admin') {
    clearTokenCookie(res);
    setAdminTokenCookie(res, result.token);
    response = {
      token: result.token,
      sessionType: 'admin',
      admin: result.admin,
    };
  } else {
    const token = signToken(result.id, rememberMe);
    clearAdminTokenCookie(res);
    setTokenCookie(res, token, rememberMe);
    response = {
      token,
      sessionType: 'user',
      user: {
        id: result.id,
        email: result.email,
        displayName: result.displayName,
        avatarUrl: result.avatarUrl,
      },
    };
  }

  res.json({ success: true, data: response });
}));

// POST /api/auth/logout
router.post('/logout', (req: AuthRequest, res: Response): void => {
  clearTokenCookie(res);
  clearAdminTokenCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await authService.getUserById(req.userId!);
  res.status(200).json({ success: true, data: user });
}));

// GET /api/auth/token — คืน fresh token สำหรับ Socket auth (ใช้ตอน page refresh)
router.get('/token', authenticate, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const token = signToken(req.userId!);
  setTokenCookie(res, token);
  res.json({ success: true, data: { token } });
}));

// POST /api/auth/forgot-password
router.post('/forgot-password', validateRequest(ForgotPasswordSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await authService.forgotPassword(req.body.email);
  res.json({ success: true, data: result });
}));

// POST /api/auth/reset-password
router.post('/reset-password', validateRequest(ResetPasswordSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;
  const result = await authService.resetPassword(token, newPassword);
  res.json({ success: true, data: result });
}));

// PATCH /api/auth/profile
router.patch('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { displayName, bio } = req.body;
  const user = await authService.updateProfile(req.userId!, { displayName, bio });
  res.json({ success: true, data: user });
}));

// POST /api/auth/avatar
router.post('/avatar', authenticate, avatarUpload.single('avatar'), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const file = req.file;
  if (!file) { res.status(400).json({ success: false, error: 'No file uploaded' }); return; }
  const user = await authService.updateUserAvatar(req.userId!, file.buffer, file.mimetype, file.originalname);
  res.json({ success: true, data: user });
}));

export default router;
