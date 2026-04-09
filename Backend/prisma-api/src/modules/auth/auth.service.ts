import { RegisterPayload, LoginPayload } from '../../types';
import { AppError } from '../../types';
import { hashPassword, comparePassword } from '../../utils/password.hash';
import { signResetToken, verifyResetToken } from '../../utils/jwt.utils';
import { sendPasswordResetEmail } from '../../utils/email.service';
import {
  uploadAvatar,
  deleteOldAvatar,
} from '../../utils/supabase-storage';
import * as authRepository from './auth.repository';

/**
 * Register new user
 */
export const registerUser = async (data: RegisterPayload) => {
  const existingUser = await authRepository.findByEmail(data.email);
  if (existingUser) {
    throw new AppError(409, 'Email already registered');
  }

  const hashedPassword = await hashPassword(data.password);
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

/**
 * Login user
 */
export const loginUser = async (data: LoginPayload) => {
  const user = await authRepository.findByEmail(data.email);
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  if (!user.passwordHash) {
    throw new AppError(
      401,
      `บัญชีนี้เชื่อมกับ ${user.provider || 'OAuth'} — กรุณาเข้าสู่ระบบด้วย ${user.provider || 'OAuth'}`,
    );
  }

  const isPasswordValid = await comparePassword(
    data.password,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.Name,
    avatarUrl: user.avatarUrl,
  };
};

/**
 * Get user by ID (สำหรับ GET /api/auth/me)
 */
export const getUserById = async (userId: string) => {
  const user = await authRepository.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
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

/**
 * Forgot Password — สร้าง reset token ให้กับอีเมลที่ระบุ
 */
export const forgotPassword = async (email: string) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  if (!user.passwordHash) {
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  const resetToken = signResetToken(user.id);

  const hasResendKey = Boolean(process.env.RESEND_API_KEY);
  if (hasResendKey) {
    await sendPasswordResetEmail(user.email, resetToken);
  }

  const isDev = process.env.NODE_ENV === 'development';
  return {
    message: 'If that email exists, a reset link has been sent.',
    ...(isDev && !hasResendKey && { resetToken, expiresInMinutes: 15 }),
  };
};

/**
 * Reset Password — ตรวจสอบ token แล้วเปลี่ยนรหัสผ่าน
 */
export const resetPassword = async (token: string, newPassword: string) => {
  const userId = verifyResetToken(token);

  const user = await authRepository.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  if (!user.passwordHash) {
    throw new AppError(400, 'This account uses OAuth login and cannot reset password.');
  }

  const hashedPassword = await hashPassword(newPassword);
  await authRepository.updatePassword(userId, hashedPassword);

  return { message: 'Password has been reset successfully.' };
};

// ======================================================
// UPDATE PROFILE
// ======================================================

interface UpdateProfileData {
  displayName?: string;
  bio?: string;
}

/**
 * อัปเดตข้อมูลโปรไฟล์ (displayName, bio)
 */
export const updateProfile = async (
  userId: string,
  data: UpdateProfileData,
) => {
  const user = await authRepository.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

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

/**
 * อัปโหลด avatar ของ user ไปยัง Supabase Storage แล้วอัปเดต avatarUrl ใน DB
 */
export const updateUserAvatar = async (
  userId: string,
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
) => {
  const user = await authRepository.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  await deleteOldAvatar(user.avatarUrl);

  const publicUrl = await uploadAvatar(
    userId,
    fileBuffer,
    mimeType,
    originalName,
  );

  const updated = await authRepository.updateAvatar(userId, publicUrl);

  return {
    id: updated.id,
    email: updated.email,
    displayName: updated.Name,
    avatarUrl: updated.avatarUrl,
    bio: updated.bio,
  };
};
