import { Router } from 'express';
import { Response } from 'express';
import rateLimit from 'express-rate-limit';
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

// ป้องกัน brute force: login/register/forgot-password จำกัด 10 ครั้ง/15 นาที ต่อ IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'ลองบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่' },
});

// POST /api/auth/register
router.post('/register', authLimiter, validateRequest(RegisterSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await authService.registerUser(req.body);
  const token = signToken(user.id);
  setTokenCookie(res, token);
  const response: LoginResponse = { token, sessionType: 'user', user };
  res.status(201).json({ success: true, data: response });
}));

// POST /api/auth/login
router.post('/login', authLimiter, validateRequest(LoginSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await authService.loginUser(req.body);
  const rememberMe = Boolean(req.body.rememberMe);

  let response: LoginResponse; // ประกาศตัวแปร response พื่อจะเอาไว้เก็บข้อมูล response ที่จะส่งกลับ client

  if (result.sessionType === 'admin') {  // ถ้าเป็น admin session
    clearTokenCookie(res);  // ล้าง cookie ของ user ทั่วไปออกก่อน เผื่อมีอยู่แล้ว
    setAdminTokenCookie(res, result.token); // เก็บ token ของ admin ไว้ใน cookie แยกต่างหาก
    response = { // เตรียมข้อมูล response สำหรับ admin
      token: result.token,
      sessionType: 'admin',
      admin: result.admin,
    };
  } else {
    const token = signToken(result.id, rememberMe); // สร้าง token สำหรับ user
    clearAdminTokenCookie(res);  // ล้าง cookie 
    setTokenCookie(res, token, rememberMe); // เก็บ token ของ user ไว้ใน cookie
    response = { // เตรียมข้อมูล response สำหรับ user
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

  res.json({ success: true, data: response }); // ส่ง response กลับไปยัง client
}));

// POST /api/auth/logout
router.post('/logout', (_req: AuthRequest, res: Response): void => {
  clearTokenCookie(res); // ล้าง cookie ของ user ทั่วไป
  clearAdminTokenCookie(res); // ล้าง cookie ของ admin
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await authService.getUserById(req.userId!); // ดึงข้อมูล user จาก DB โดยใช้ userId 
  res.status(200).json({ success: true, data: user });
}));

// GET /api/auth/token — คืน fresh token สำหรับ Socket auth (ใช้ตอน page refresh)
router.get('/token', authenticate, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const token = signToken(req.userId!); // สร้าง token ใหม่
  setTokenCookie(res, token); // อัพเดต cookie ด้วย token ใหม่ เผื่อมีการ refresh หน้าเว็บแล้ว token เก่าหมดอายุ
  res.json({ success: true, data: { token } });
}));

// POST /api/auth/forgot-password  // สร้าง reset token และส่งอีเมลรีเซ็ตรหัสผ่าน
router.post('/forgot-password', authLimiter, validateRequest(ForgotPasswordSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await authService.forgotPassword(req.body.email);
  res.json({ success: true, data: result });
}));

// POST /api/auth/reset-password  // รีเซ็ตรหัสผ่านโดยใช้ reset token ที่ได้รับจากอีเมล
router.post('/reset-password', validateRequest(ResetPasswordSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { token, newPassword } = req.body; // ดึง token กับรหัสผ่านใหม่จาก request body
  const result = await authService.resetPassword(token, newPassword); // เรียก service เพื่อรีเซ็ตรหัสผ่าน โดยส่ง token กับรหัสผ่านใหม่ไป
  res.json({ success: true, data: result });
}));

// PATCH /api/auth/profile // อัพเดตข้อมูลโปรไฟล์ของ user 
router.patch('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { displayName, bio } = req.body; // ดึง displayName กับ bio จาก request body
  const user = await authService.updateProfile(req.userId!, { displayName, bio }); // เรียก service เพื่ออัปเดตข้อมูลโปรไฟล์ โดยส่ง userId กับข้อมูลที่ต้องการอัปเดตไป
  res.json({ success: true, data: user });
}));

// POST /api/auth/avatar // อัปโหลดรูปโปรไฟล์ใหม่
router.post('/avatar', authenticate, avatarUpload.single('avatar'), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const file = req.file; // ดึงไฟล์ที่อัปโหลดจาก request
  if (!file) { res.status(400).json({ success: false, error: 'No file uploaded' }); return; } // ถ้าไม่มีไฟล์ใน request ให้ส่ง error กลับไป
  const user = await authService.updateUserAvatar(req.userId!, file.buffer, file.mimetype, file.originalname); // เรียก service เพื่ออัปโหลด avatar และอัปเดต avatarUrl ใน DB
  res.json({ success: true, data: user }); // ส่งข้อมูล user ที่อัปเดตแล้วกลับไปยัง client
}));

export default router;
