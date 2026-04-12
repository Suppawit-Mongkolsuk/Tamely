"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyResetToken = exports.signResetToken = exports.extractToken = exports.clearTokenCookie = exports.getTokenFromCookie = exports.setTokenCookie = exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SESSION_COOKIE_MS = 0; // 0 = session cookie (หมดเมื่อปิด browser)
const REMEMBER_COOKIE_MS = 30 * 24 * 60 * 60 * 1000; // 30 วัน
/**
 * สร้าง JWT token
 * @param userId - ID ของ user
 * @param rememberMe - ถ้า true → token อายุ 30 วัน, false → 7 วัน
 * @returns JWT token string
 */
const signToken = (userId, rememberMe = false) => {
    const expiresIn = rememberMe ? '30d' : EXPIRES_IN;
    return jsonwebtoken_1.default.sign({ userId }, SECRET, { expiresIn });
};
exports.signToken = signToken;
/**
 * ตรวจสอบและถอด JWT token
 * @param token - JWT token string
 * @returns { userId: string }
 */
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, SECRET);
    }
    catch (error) {
        throw new Error('Invalid or expired token');
    }
};
exports.verifyToken = verifyToken;
/**
 * ส่ง token ไป Browser เป็น HTTP-only Cookie 🍪
 * @param res - Express Response object
 * @param token - JWT token string
 * @param rememberMe - ถ้า true → cookie อายุ 30 วัน, false → session cookie (หมดเมื่อปิด browser)
 */
const setTokenCookie = (res, token, rememberMe = false) => {
    res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // ใช้ lax เพื่อรองรับ OAuth redirect (strict จะ block cross-site)
        maxAge: rememberMe ? REMEMBER_COOKIE_MS : SESSION_COOKIE_MS || undefined,
        path: '/',
    });
};
exports.setTokenCookie = setTokenCookie;
/**
 * ดึง token จาก Cookie
 * @param cookies - cookies object (จาก req.cookies)
 * @returns token string หรือ null
 */
const getTokenFromCookie = (cookies) => {
    if (!cookies || !cookies.accessToken)
        return null;
    return cookies.accessToken;
};
exports.getTokenFromCookie = getTokenFromCookie;
/**
 * ลบ cookie logout
 * @param res - Express Response object
 */
const clearTokenCookie = (res) => {
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
    // force overwrite ด้วย cookie ที่หมดอายุแล้ว เป็น fallback กรณี clearCookie ไม่ work
    res.cookie('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(0),
        maxAge: 0,
    });
};
exports.clearTokenCookie = clearTokenCookie;
/**
 * mobile app
 * @param authHeader - Authorization header
 * @returns token string หรือ null ถ้าไม่มี
 */
const extractToken = (authHeader) => {
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer')
        return null;
    return parts[1];
};
exports.extractToken = extractToken;
// ===== Password Reset Token (อายุ 15 นาที) =====
/**
 * สร้าง JWT สำหรับ reset password (อายุ 15 นาที)
 * payload รวม userId + purpose: 'reset' เพื่อป้องกัน token ประเภทอื่นมาใช้ซ้ำ
 */
const signResetToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId, purpose: 'reset' }, SECRET, { expiresIn: '15m' });
};
exports.signResetToken = signResetToken;
/**
 * ตรวจสอบ reset token
 * @returns userId ถ้า valid
 * @throws Error ถ้า token หมดอายุ / ไม่ใช่ reset token
 */
const verifyResetToken = (token) => {
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(token, SECRET);
    }
    catch (_a) {
        throw new Error('Reset link is invalid or has expired. Please request a new one.');
    }
    if (payload.purpose !== 'reset') {
        throw new Error('Invalid reset token.');
    }
    return payload.userId;
};
exports.verifyResetToken = verifyResetToken;
//# sourceMappingURL=jwt.utils.js.map