import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { JwtPayload } from '../types';

const SECRET: string =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

const SESSION_COOKIE_MS = 0; // 0 = session cookie (หมดเมื่อปิด browser)
const REMEMBER_COOKIE_MS = 30 * 24 * 60 * 60 * 1000; // 30 วัน

/**
 * สร้าง JWT token
 * @param userId - ID ของ user
 * @param rememberMe - ถ้า true → token อายุ 30 วัน, false → 7 วัน
 * @returns JWT token string
 */
export const signToken = (userId: string, rememberMe = false): string => {
  const expiresIn = rememberMe ? '30d' : EXPIRES_IN;
  return jwt.sign({ userId }, SECRET, { expiresIn } as any);
};

/**
 * ตรวจสอบและถอด JWT token
 * @param token - JWT token string
 * @returns { userId: string }
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * ส่ง token ไป Browser เป็น HTTP-only Cookie 🍪
 * @param res - Express Response object
 * @param token - JWT token string
 * @param rememberMe - ถ้า true → cookie อายุ 30 วัน, false → session cookie (หมดเมื่อปิด browser)
 */
export const setTokenCookie = (
  res: Response,
  token: string,
  rememberMe = false,
): void => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: rememberMe ? REMEMBER_COOKIE_MS : SESSION_COOKIE_MS || undefined,
    path: '/',
  });
};

/**
 * ดึง token จาก Cookie
 * @param cookies - cookies object (จาก req.cookies)
 * @returns token string หรือ null
 */
export const getTokenFromCookie = (
  cookies?: Record<string, string>,
): string | null => {
  if (!cookies || !cookies.accessToken) return null;
  return cookies.accessToken;
};

/**
 * ลบ cookie logout
 * @param res - Express Response object
 */
export const clearTokenCookie = (res: Response): void => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };
  res.clearCookie('accessToken', cookieOpts);
  res.cookie('accessToken', '', {
    ...cookieOpts,
    expires: new Date(0),
    maxAge: 0,
  });
};

/**
 * mobile app
 * @param authHeader - Authorization header
 * @returns token string หรือ null ถ้าไม่มี
 */
export const extractToken = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
};

// ===== Password Reset Token (อายุ 15 นาที) =====

/**
 * สร้าง JWT สำหรับ reset password (อายุ 15 นาที)
 * payload รวม userId + purpose: 'reset' เพื่อป้องกัน token ประเภทอื่นมาใช้ซ้ำ
 */
export const signResetToken = (userId: string): string => {
  return jwt.sign({ userId, purpose: 'reset' }, SECRET, { expiresIn: '15m' } as any);
};

/**
 * ตรวจสอบ reset token
 * @returns userId ถ้า valid
 * @throws Error ถ้า token หมดอายุ / ไม่ใช่ reset token
 */
export const verifyResetToken = (token: string): string => {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(token, SECRET) as typeof payload;
  } catch {
    throw new Error('Reset link is invalid or has expired. Please request a new one.');
  }
  if (payload.purpose !== 'reset') {
    throw new Error('Invalid reset token.');
  }
  return payload.userId;
};
