import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AuthRequest, LoginResponse } from '../../types';
import { signToken, setTokenCookie, clearTokenCookie } from '../../utils/jwt.utils';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from './auth.model';
import * as authService from './auth.service';
import multer from 'multer';

const router = Router();

// ========================
// Multer — รับ file upload ในหน่วยความจำ (max 2 MB)
// ========================
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('รองรับเฉพาะ JPG, PNG, GIF'));
  },
});

// POST /api/auth/register
router.post('/register', validateRequest(RegisterSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await authService.registerUser(req.body);
  const token = signToken(user.id);
  setTokenCookie(res, token);
  const response: LoginResponse = { token, user };
  res.status(201).json({ success: true, data: response });
}));

// POST /api/auth/login
router.post('/login', validateRequest(LoginSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await authService.loginUser(req.body);
  const rememberMe = Boolean(req.body.rememberMe);
  const token = signToken(user.id, rememberMe);
  setTokenCookie(res, token, rememberMe);
  const response: LoginResponse = { token, user };
  res.json({ success: true, data: response });
}));

// POST /api/auth/logout
router.post('/logout', (req: AuthRequest, res: Response): void => {
  clearTokenCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await authService.getUserById(req.userId!);
  res.status(200).json({ success: true, data: user });
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
