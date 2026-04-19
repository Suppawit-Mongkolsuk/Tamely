import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { AdminJwtPayload, JwtPayload } from '../types';

if (!process.env.JWT_SECRET) {
  throw new Error('[FATAL] JWT_SECRET is not set. Server cannot start without it.');
}
if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error('[FATAL] ADMIN_JWT_SECRET is not set. Server cannot start without it.');
}

const SECRET: string = process.env.JWT_SECRET; // secret key สำหรับ sign และ verify token
const EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d'; // อายุของ token
const ADMIN_SECRET: string = process.env.ADMIN_JWT_SECRET; // secret key สำหรับ sign และ verify admin token
const ADMIN_EXPIRES_IN: string | number =
  process.env.ADMIN_JWT_EXPIRES_IN || '7d'; // อายุของ admin token
const ACCESS_COOKIE_NAME = 'accessToken'; // ชื่อ cookie สำหรับเก็บ access token
const ADMIN_COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'adminAccessToken'; // ชื่อ cookie สำหรับเก็บ admin access token

const SESSION_COOKIE_MS = 0; // 0 = session cookie (หมดเมื่อปิด browser)
const REMEMBER_COOKIE_MS = 30 * 24 * 60 * 60 * 1000; // 30 วัน

const buildCookieOptions = (maxAge?: number) => { // สร้าง options สำหรับ cookie 
  const isProd = process.env.NODE_ENV === 'production'; // เช้คว่าอยู่ใน production หรือไม่ เพื่อกำหนดค่า secure และ sameSite ให้เหมาะสม
  return {
    httpOnly: true,
    secure: isProd,// ใน production ต้องใช้ secure cookie เท่านั้น (ส่งผ่าน HTTPS)
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax', // ใน production ต้องใช้ sameSite='none' เพื่อให้ cookie ถูกส่งข้ามโดเมนได้ (เช่น frontend กับ backend อยู่คนละโดเมน)
    ...(maxAge !== undefined ? { maxAge } : {}),
    path: '/',
  };
};

/**
 * สร้าง JWT token
 * @param userId - ID ของ user
 * @param rememberMe - ถ้า true → token อายุ 30 วัน, false → 7 วัน
 * @returns JWT token string
 */
export const signToken = (userId: string, rememberMe = false): string => { // กำหนดอายุ token ตามค่า rememberMe
  const expiresIn = rememberMe ? '30d' : EXPIRES_IN;
  return jwt.sign({ userId }, SECRET, { expiresIn } as any);
};

/**
 * ตรวจสอบและถอด JWT token
 * @param token - JWT token string
 * @returns { userId: string }
 */
export const verifyToken = (token: string): JwtPayload => { // ถ้า token ไม่ถูกต้องหรือหมดอายุ จะโยน error ออกมา
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
export const setTokenCookie = ( // รับ token และเรียก res.cookie(...) ส่งไปยัง browser เป็น HTTP-only Cookie
  res: Response,
  token: string,
  rememberMe = false,
): void => {
  res.cookie(
    ACCESS_COOKIE_NAME,
    token,
    buildCookieOptions(rememberMe ? REMEMBER_COOKIE_MS : SESSION_COOKIE_MS || undefined), // กำหนด maxAge ตามค่า rememberMe
  );
};

/**
 * ดึง token จาก Cookie
 * @param cookies - cookies object (จาก req.cookies)
 * @returns token string หรือ null
 */
export const getTokenFromCookie = ( // รับ cookies object และดึง token จาก cookie ที่ชื่อ ACCESS_COOKIE_NAME ถ้าไม่มีหรือ cookies เป็น undefined จะ return null
  cookies?: Record<string, string>,
): string | null => {
  if (!cookies || !cookies[ACCESS_COOKIE_NAME]) return null; // เช็ค cookies ว่ามีค่าและมี cookie ที่ชื่อ ACCESS_COOKIE_NAME หรือไม่ ถ้าไม่ return null
  return cookies[ACCESS_COOKIE_NAME]; // ถ้ามี cookie ที่ชื่อ ACCESS_COOKIE_NAME ให้ return ค่า
};

/**
 * ลบ cookie logout
 * @param res - Express Response object
 */
export const clearTokenCookie = (res: Response): void => { // ลบ cookie logout
  const cookieOpts = buildCookieOptions(); // สร้าง options เดียวกับตอน set cookie เพื่อให้ browser รู้ว่าต้องลบ cookie ไหน
  res.clearCookie(ACCESS_COOKIE_NAME, cookieOpts); // เรียก res.clearCookie(...) เพื่อบอก browser ให้ลบ cookie ที่ชื่อ ACCESS_COOKIE_NAME
  res.cookie(ACCESS_COOKIE_NAME, '', { // ตั้งค่า cookie เป็นค่าว่างและกำหนด expires เป็นวันที่ในอดีต เพื่อให้ browser ลบ cookie นี้
    ...cookieOpts,
    expires: new Date(0), // กำหนด expires เป็นวันที่ในอดีต
    maxAge: 0, // กำหนด maxAge เป็น 0 เพื่อให้ browser ลบ cookie นี้
  });
};

export const signAdminToken = (username: string): string => { // สร้าง JWT token สำหรับ admin โดยมี payload เป็น { username, purpose: 'admin' }
  return jwt.sign({ username, purpose: 'admin' }, ADMIN_SECRET, {
    expiresIn: ADMIN_EXPIRES_IN,
  } as any);
};

export const verifyAdminToken = (token: string): AdminJwtPayload => { // ตรวจสอบและถอด JWT token สำหรับ admin 
  try {
    const payload = jwt.verify(token, ADMIN_SECRET) as AdminJwtPayload;
    if (payload.purpose !== 'admin') { // เช็คว่า payload มี property purpose และค่าเป็น 'admin' หรือไม่ ถ้าไม่ใช่จะโยน error ออกมา
      throw new Error('Invalid admin token');
    }
    return payload;
  } catch {
    throw new Error('Invalid or expired admin token');
  }
};

export const setAdminTokenCookie = (res: Response, token: string): void => { // ส่ง token ไป Browser เป็น HTTP-only Cookie สำหรับ admin
  res.cookie(ADMIN_COOKIE_NAME, token, buildCookieOptions());
};

export const getAdminTokenFromCookie = ( // ดึง token จาก Cookie สำหรับ admin
  cookies?: Record<string, string>,
): string | null => {
  if (!cookies || !cookies[ADMIN_COOKIE_NAME]) return null;
  return cookies[ADMIN_COOKIE_NAME];
};

export const clearAdminTokenCookie = (res: Response): void => { // ลบ cookie logout สำหรับ admin
  const cookieOpts = buildCookieOptions(); // สร้าง options เดียวกับตอน set cookie เพื่อให้ browser รู้ว่าต้องลบ cookie ไหน
  res.clearCookie(ADMIN_COOKIE_NAME, cookieOpts); // เรียก res.clearCookie(...) เพื่อบอก browser ให้ลบ cookie ที่ชื่อ ADMIN_COOKIE_NAME
  res.cookie(ADMIN_COOKIE_NAME, '', { // ตั้งค่า cookie เป็นค่าว่างและกำหนด expires เป็นวันที่ในอดีต เพื่อให้ browser ลบ cookie นี้
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
export const extractToken = (authHeader?: string): string | null => { // ดึง token จาก Authorization header ของ mobile app
  if (!authHeader) return null;  // เช็คว่า authHeader มีค่าไหม ถ้าไม่มี return null
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null; // เช็คว่า header มีรูปแบบ Bearer token หรือไม่ ถ้าไม่ใช่ return null
  return parts[1]; // ถ้า header ถูกต้อง return token
};

// ===== Password Reset Token (อายุ 15 นาที) =====

/**
 * สร้าง JWT สำหรับ reset password (อายุ 15 นาที)
 * payload รวม userId + purpose: 'reset' เพื่อป้องกัน token ประเภทอื่นมาใช้ซ้ำ
 */
export const signResetToken = (userId: string): string => { // สร้าง JWT token สำหรับ reset password โดยมี payload เป็น { userId, purpose: 'reset' } และอายุ 15 นาที
  return jwt.sign({ userId, purpose: 'reset' }, SECRET, { expiresIn: '15m' } as any);
};

/**
 * ตรวจสอบ reset token
 * @returns userId ถ้า valid
 * @throws Error ถ้า token หมดอายุ / ไม่ใช่ reset token
 */
export const verifyResetToken = (token: string): string => { // ถ้า token ไม่ถูกต้องหรือหมดอายุ จะโยน error ออกมา
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(token, SECRET) as typeof payload; // ถอด token และตรวจสอบว่า payload มี userId และ purpose หรือไม่ ถ้าไม่ใช่จะโยน error ออกมา
  } catch {
    throw new Error('Reset link is invalid or has expired. Please request a new one.');
  }
  if (payload.purpose !== 'reset') { // เช็คว่า payload มี property purpose และค่าเป็น 'reset' หรือไม่ ถ้าไม่ใช่จะโยน error ออกมา
    throw new Error('Invalid reset token.');
  }
  return payload.userId;
};
