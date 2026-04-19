import { RegisterPayload, LoginPayload } from '../../types';
import { AppError } from '../../types';
import { hashPassword, comparePassword } from '../../utils/password.hash';
import { signResetToken, verifyResetToken } from '../../utils/jwt.utils';
import { sendPasswordResetEmail } from '../../utils/email.service';
import {
  uploadAvatar,
  deleteOldAvatar,
} from '../../utils/supabase-storage';
import { UpdateProfileData } from './auth.model';
import * as authRepository from './auth.repository';
import * as adminService from '../admin/admin.service';

/**
 * Register new user
 */
export const registerUser = async (data: RegisterPayload) => { 
  const existingUser = await authRepository.findByEmail(data.email); // ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือไม่
  if (existingUser) {
    throw new AppError(409, 'Email already registered');
  }

  const hashedPassword = await hashPassword(data.password); // แฮชรหัสผ่านก่อนเก็บลง DB
  const user = await authRepository.createUser({ // สร้าง user ใหม่ใน DB
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
  const configuredAdminUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase(); // ดึงค่า ADMIN_USERNAME 
  if (configuredAdminUsername && data.email.trim().toLowerCase() === configuredAdminUsername) { // เช็คว่าเป็น Admin หรือไม่
    const adminSession = await adminService.loginAdmin(data.email.trim(), data.password); // ถ้าใช่ ให้ไปเช็คกับ adminService แทน
    return {
      token: adminSession.token,
      sessionType: 'admin' as const, // ระบุว่า session นี้เป็นของ admin
      admin: adminSession.admin, // ข้อมูลโปรไฟล์ admin 
    };
  }

  const user = await authRepository.findByEmail(data.email); 
  if (!user) { // ถ้าไม่พบ user ที่มีอีเมลนี้ในระบบ ให้โยน error ออกมา
    throw new AppError(401, 'Invalid email or password');
  }

  if (!user.passwordHash) { // เช็ตถ้าไม่มี passwordHash แสดงว่าเป็นบัญชีที่สร้างจาก OAuth 
    throw new AppError(
      401,
      `บัญชีนี้เชื่อมกับ ${user.provider || 'OAuth'} — กรุณาเข้าสู่ระบบด้วย ${user.provider || 'OAuth'}`,
    );
  }

  const isPasswordValid = await comparePassword( // เปรียบเทียบรหัสผ่านที่กรอกมา กับ hash ที่เก็บใน DB ว่าตรงกันหรือไม่
    data.password,
    user.passwordHash,
  );
  if (!isPasswordValid) { // เช็คว่าตรงกันไหม
    throw new AppError(401, 'Invalid email or password');
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.Name,
    avatarUrl: user.avatarUrl,
    sessionType: 'user' as const, // ระบุว่า session นี้เป็นของ user
  };
};

/**
 * Get user by ID (สำหรับ GET /api/auth/me)
 */
export const getUserById = async (userId: string) => {
  const user = await authRepository.findById(userId);
  if (!user) { // ถ้าไม่พบ user ที่มี ID นี้ในระบบ ให้โยน error ออกมา
    throw new AppError(404, 'User not found');
  }

  return { // คืนข้อมูล user ที่จำเป็นสำหรับ client
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

  if (!user) { // ถ้าไม่พบ user ที่มีอีเมลนี้ในระบบ ให้ return ข้อความเหมือนกับตอนที่ส่งอีเมลสำเร็จ เพื่อไม่ให้แฮกเกอร์รู้ว่าอีเมลไหนมีบัญชีอยู่บ้าง
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  if (!user.passwordHash) { // ถ้าไม่มี passwordHash แสดงว่าเป็นบัญชีที่สร้างจาก OAuth ซึ่งไม่สามารถรีเซ็ตรหัสผ่านได้
    throw Object.assign(
      new AppError(400, 'บัญชีนี้ใช้การเข้าสู่ระบบผ่าน Google หรือ GitHub กรุณาเข้าสู่ระบบด้วยวิธีนั้นแทน'),
      { code: 'OAUTH_ACCOUNT' },
    );
  }

  const resetToken = signResetToken(user.id); // สร้าง reset token ที่มีข้อมูล userId อยู่ข้างใน และมีอายุ 15 นาที

  const hasResendKey = Boolean(process.env.RESEND_API_KEY); // ตรวจสอบว่ามีค่า RESEND_API_KEY หรือไม่
  if (hasResendKey) { // ถ้ามีค่า RESEND_API_KEY ให้ส่งอีเมลรีเซ็ตรหัสผ่านจริงๆ ไปยังผู้ใช้
    await sendPasswordResetEmail(user.email, resetToken);
  }

  const isDev = process.env.NODE_ENV === 'development';  // สำหรับ dev
  return {
    message: 'If that email exists, a reset link has been sent.', 
    ...(isDev && !hasResendKey && { resetToken, expiresInMinutes: 15 }),
  };
};

/**
 * Reset Password — ตรวจสอบ token แล้วเปลี่ยนรหัสผ่าน
 */
export const resetPassword = async (token: string, newPassword: string) => {
  const userId = verifyResetToken(token); // ตรวจสอบว่า token ถูกต้องและยังไม่หมดอายุ 

  const user = await authRepository.findById(userId);
  if (!user) { // ถ้าไม่พบ user ที่มี ID นี้ในระบบ ให้โยน error ออกมา
    throw new AppError(404, 'User not found.');
  }

  if (!user.passwordHash) { // ถ้าไม่มี passwordHash แสดงว่าเป็นบัญชีที่สร้างจาก OAuth ซึ่งไม่สามารถรีเซ็ตรหัสผ่านได้
    throw new AppError(400, 'This account uses OAuth login and cannot reset password.');
  }

  const hashedPassword = await hashPassword(newPassword); // แปลงรหัสผ่านใหม่เป็น hash
  await authRepository.updatePassword(userId, hashedPassword); // อัปเดตรหัสผ่านใน DB

  return { message: 'Password has been reset successfully.' };
};

// ======================================================
// UPDATE PROFILE
// ======================================================


/**
 * อัปเดตข้อมูลโปรไฟล์ (displayName, bio)
 */
export const updateProfile = async (
  userId: string, // 
  data: UpdateProfileData,
) => {
  const user = await authRepository.findById(userId); // หา user โดยใช้ ID
  if (!user) throw new AppError(404, 'User not found'); // ถ้าไม่พบ user ที่มี ID นี้ในระบบ ให้โยน error ออกมา

  const updated = await authRepository.updateUser(userId, { // อัปเดตข้อมูล user ใน DB โดยส่งเฉพาะฟิลด์ที่มีค่าเท่านั้น
    ...(data.displayName !== undefined && { Name: data.displayName }), // ถ้า displayName มีค่า ให้รวมเข้าไปใน object ที่จะอัปเดต
    ...(data.bio !== undefined && { bio: data.bio }), // ถ้า bio มีค่า ให้รวมเข้าไปใน object ที่จะอัปเดต
  });

  return { // คืนข้อมูล user ที่อัปเดตแล้ว กลับไปยัง client
    //id: updated.id,
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
