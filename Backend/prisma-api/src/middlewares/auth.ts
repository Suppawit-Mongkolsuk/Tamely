import { Request, Response, NextFunction } from 'express';
import {
  verifyToken,
  getTokenFromCookie,
  extractToken,
} from '../utils/jwt.utils';
import { AuthRequest } from '../types';

// Middleware ตรวจสอบ JWT token
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    // ดึง token จาก Cookie
    let token = getTokenFromCookie(req.cookies);

    // ถ้าไม่มี ลองดึงจาก Authorization header
    if (!token) {
      token = extractToken(req.headers.authorization);
    }

    // ถ้าไม่มี token เลย
    if (!token) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    // ตรวจสอบ token
    const payload = verifyToken(token);
    req.userId = payload.userId;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
