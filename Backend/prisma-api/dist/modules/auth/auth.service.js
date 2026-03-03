"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.loginUser = exports.registerUser = void 0;
const index_1 = require("../../index");
const password_hash_1 = require("../../utils/password.hash");
/**
 * Register new user
 * @param data - { email, password, displayName }
 * @returns User object without password
 */
const registerUser = async (data) => {
    // เช็คว่ามีอีเมลนี้ในระบบหรือยัง
    const existinUser = await index_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (existinUser) {
        throw new Error('Email already registered');
    }
    //  เเฮชรหัสผ่าน
    const hashedPassword = await (0, password_hash_1.hashPassword)(data.password);
    // สร้างผู้ใช้ใหม่ในฐานข้อมูล
    const user = await index_1.prisma.user.create({
        data: {
            email: data.email,
            passwordHash: hashedPassword,
            Name: data.displayName,
        },
    });
    return {
        id: user.id,
        email: user.email,
        displayName: user.Name,
    };
};
exports.registerUser = registerUser;
/**
 * Login user
 * @param data - { email, password }
 * @returns User object without password
 */
const loginUser = async (data) => {
    // หาอีเมลในฐานข้อมูล
    const user = await index_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (!user) {
        throw new Error('Invalid email or password');
    }
    // เช็คว่ารหัสผ่านถูกต้องหรือไม่
    const isPasswordValid = await (0, password_hash_1.comparePassword)(data.password, user.passwordHash || '');
    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }
    return {
        id: user.id,
        email: user.email,
        displayName: user.Name,
        avatarUrl: user.avatarUrl,
    };
};
exports.loginUser = loginUser;
/**
 * Get user by ID (สำหรับ GET /api/auth/me)
 * @param userId - User ID from JWT token
 * @returns User object
 */
const getUserById = async (userId) => {
    const user = await index_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error('User not found');
    }
    return {
        id: user.id,
        email: user.email,
        displayName: user.Name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        lastSeenAt: user.lastSeenAt,
    };
};
exports.getUserById = getUserById;
//# sourceMappingURL=auth.service.js.map