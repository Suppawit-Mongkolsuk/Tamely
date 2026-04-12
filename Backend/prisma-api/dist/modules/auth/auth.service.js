"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserAvatar = exports.updateProfile = exports.resetPassword = exports.forgotPassword = exports.getUserById = exports.loginUser = exports.registerUser = void 0;
const types_1 = require("../../types");
const password_hash_1 = require("../../utils/password.hash");
const jwt_utils_1 = require("../../utils/jwt.utils");
const email_service_1 = require("../../utils/email.service");
const supabase_storage_1 = require("../../utils/supabase-storage");
const authRepository = __importStar(require("./auth.repository"));
/**
 * Register new user
 */
const registerUser = async (data) => {
    const existingUser = await authRepository.findByEmail(data.email);
    if (existingUser) {
        throw new types_1.AppError(409, 'Email already registered');
    }
    const hashedPassword = await (0, password_hash_1.hashPassword)(data.password);
    const user = await authRepository.createUser({
        email: data.email,
        passwordHash: hashedPassword,
        name: data.displayName,
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
 */
const loginUser = async (data) => {
    const user = await authRepository.findByEmail(data.email);
    if (!user) {
        throw new types_1.AppError(401, 'Invalid email or password');
    }
    if (!user.passwordHash) {
        throw new types_1.AppError(401, `บัญชีนี้เชื่อมกับ ${user.provider || 'OAuth'} — กรุณาเข้าสู่ระบบด้วย ${user.provider || 'OAuth'}`);
    }
    const isPasswordValid = await (0, password_hash_1.comparePassword)(data.password, user.passwordHash);
    if (!isPasswordValid) {
        throw new types_1.AppError(401, 'Invalid email or password');
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
 */
const getUserById = async (userId) => {
    const user = await authRepository.findById(userId);
    if (!user) {
        throw new types_1.AppError(404, 'User not found');
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
/**
 * Forgot Password — สร้าง reset token ให้กับอีเมลที่ระบุ
 */
const forgotPassword = async (email) => {
    const user = await authRepository.findByEmail(email);
    if (!user) {
        return { message: 'If that email exists, a reset link has been sent.' };
    }
    if (!user.passwordHash) {
        return { message: 'If that email exists, a reset link has been sent.' };
    }
    const resetToken = (0, jwt_utils_1.signResetToken)(user.id);
    const hasResendKey = Boolean(process.env.RESEND_API_KEY);
    if (hasResendKey) {
        await (0, email_service_1.sendPasswordResetEmail)(user.email, resetToken);
    }
    const isDev = process.env.NODE_ENV === 'development';
    return {
        message: 'If that email exists, a reset link has been sent.',
        ...(isDev && !hasResendKey && { resetToken, expiresInMinutes: 15 }),
    };
};
exports.forgotPassword = forgotPassword;
/**
 * Reset Password — ตรวจสอบ token แล้วเปลี่ยนรหัสผ่าน
 */
const resetPassword = async (token, newPassword) => {
    const userId = (0, jwt_utils_1.verifyResetToken)(token);
    const user = await authRepository.findById(userId);
    if (!user) {
        throw new types_1.AppError(404, 'User not found.');
    }
    if (!user.passwordHash) {
        throw new types_1.AppError(400, 'This account uses OAuth login and cannot reset password.');
    }
    const hashedPassword = await (0, password_hash_1.hashPassword)(newPassword);
    await authRepository.updatePassword(userId, hashedPassword);
    return { message: 'Password has been reset successfully.' };
};
exports.resetPassword = resetPassword;
/**
 * อัปเดตข้อมูลโปรไฟล์ (displayName, bio)
 */
const updateProfile = async (userId, data) => {
    const user = await authRepository.findById(userId);
    if (!user)
        throw new types_1.AppError(404, 'User not found');
    const updated = await authRepository.updateUser(userId, {
        ...(data.displayName !== undefined && { Name: data.displayName }),
        ...(data.bio !== undefined && { bio: data.bio }),
    });
    return {
        id: updated.id,
        email: updated.email,
        displayName: updated.Name,
        avatarUrl: updated.avatarUrl,
        bio: updated.bio,
    };
};
exports.updateProfile = updateProfile;
/**
 * อัปโหลด avatar ของ user ไปยัง Supabase Storage แล้วอัปเดต avatarUrl ใน DB
 */
const updateUserAvatar = async (userId, fileBuffer, mimeType, originalName) => {
    const user = await authRepository.findById(userId);
    if (!user)
        throw new types_1.AppError(404, 'User not found');
    await (0, supabase_storage_1.deleteOldAvatar)(user.avatarUrl);
    const publicUrl = await (0, supabase_storage_1.uploadAvatar)(userId, fileBuffer, mimeType, originalName);
    const updated = await authRepository.updateAvatar(userId, publicUrl);
    return {
        id: updated.id,
        email: updated.email,
        displayName: updated.Name,
        avatarUrl: updated.avatarUrl,
        bio: updated.bio,
    };
};
exports.updateUserAvatar = updateUserAvatar;
//# sourceMappingURL=auth.service.js.map