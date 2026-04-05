"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractToken = exports.clearTokenCookie = exports.getTokenFromCookie = exports.setTokenCookie = exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
/**
 * สร้าง JWT token
 * @param userId - ID ของ user
 * @returns JWT token string
 */
const signToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, SECRET, { expiresIn: EXPIRES_IN });
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
 */
const setTokenCookie = (res, token) => {
    res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: COOKIE_EXPIRES_MS,
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
        sameSite: 'strict',
        path: '/',
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
//# sourceMappingURL=jwt.utils.js.map