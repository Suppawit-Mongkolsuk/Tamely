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
    // 🚨 ติดเครื่องดักฟังไว้ตรงนี้!
    console.log("🚨 Incoming Data:", req.body);

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