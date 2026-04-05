import { Response } from 'express';
import { AuthRequest, LoginResponse } from '../../types';
import {
  signToken,
  setTokenCookie,
  clearTokenCookie,
} from '../../utils/jwt.utils';
import { validateRegisterInput, validateLoginInput } from './auth.validation';
import * as authService from './auth.service';

/**
 * POST /api/auth/register
 * สมัครสมาชิก
 */
export const register = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // 1. Validate input
    const validation = validateRegisterInput(
      req.body.email,
      req.body.password,
      req.body.displayName,
    );
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.message });
      return;
    }

    // 2. Register user (service)
    const user = await authService.registerUser(req.body);

    // 3. Create token
    const token = signToken(user.id);

    // 4. Set cookie
    setTokenCookie(res, token);

    // 5. Return response
    const response: LoginResponse = {
      token,
      user,
    };

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ success: false, error: message });
  }
};

// post /api/auth/login
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Validate input
    const validation = validateLoginInput(req.body);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.message });
      return;
    }

    // 2. Login user (service)
    const user = await authService.loginUser(req.body);

    // 3. Create token (rememberMe → อายุ 30 วัน, ไม่ติ๊ก → session)
    const rememberMe = Boolean(req.body.rememberMe);
    const token = signToken(user.id, rememberMe);

    // 4. Set cookie
    setTokenCookie(res, token, rememberMe);

    // 5. Return response
    const response: LoginResponse = {
      token,
      user,
    };

    res.json({ success: true, data: response });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ success: false, error: message });
  }
};

/**
 * POST /api/auth/logout
 * ออกจากระบบ
 */
export const logout = (req: AuthRequest, res: Response): void => {
  try {
    clearTokenCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    res.status(400).json({ success: false, error: message });
  }
};

/**
 * GET /api/auth/me
 * ดูข้อมูลตัวเอง (ต้อง login)
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await authService.getUserById(req.userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch user';
    res.status(404).json({ success: false, error: message });
  }
};

/**
 * POST /api/auth/forgot-password
 * ขอ reset token สำหรับ email ที่ระบุ
 * Body: { email: string }
 */
export const forgotPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'Email is required.' });
      return;
    }

    const result = await authService.forgotPassword(email.trim().toLowerCase());
    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    res.status(500).json({ success: false, error: message });
  }
};

/**
 * POST /api/auth/reset-password
 * รีเซ็ตรหัสผ่านด้วย token ที่ได้รับ
 * Body: { token: string, newPassword: string }
 */
export const resetPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, error: 'Reset token is required.' });
      return;
    }
    if (!newPassword || typeof newPassword !== 'string') {
      res.status(400).json({ success: false, error: 'New password is required.' });
      return;
    }
    if (newPassword.length < 8) {
      res
        .status(400)
        .json({ success: false, error: 'Password must be at least 8 characters.' });
      return;
    }

    const result = await authService.resetPassword(token, newPassword);
    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reset failed';
    // 400 สำหรับ token invalid/expired, 500 สำหรับ error อื่น
    const statusCode =
      message.includes('invalid') || message.includes('expired') ? 400 : 500;
    res.status(statusCode).json({ success: false, error: message });
  }
};
