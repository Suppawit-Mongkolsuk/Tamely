import { prisma } from '../../index';
import { RegisterPayload, LoginPayload } from '../../types';
import { hashPassword, comparePassword } from '../../utils/password.hash';
import { signResetToken, verifyResetToken } from '../../utils/jwt.utils';
import { sendPasswordResetEmail } from '../../utils/email.service';

/**
 * Register new user
 * @param data - { email, password, displayName }
 * @returns User object without password
 */
export const registerUser = async (data: RegisterPayload) => {
  // เช็คว่ามีอีเมลนี้ในระบบหรือยัง
  const existinUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existinUser) {
    throw new Error('Email already registered');
  }

  //  เเฮชรหัสผ่าน
  const hashedPassword = await hashPassword(data.password);

  // สร้างผู้ใช้ใหม่ในฐานข้อมูล
  const user = await prisma.user.create({
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

/**
 * Login user
 * @param data - { email, password }
 * @returns User object without password
 */
export const loginUser = async (data: LoginPayload) => {
  // หาอีเมลในฐานข้อมูล
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // OAuth-only user ไม่มี password → ต้อง login ผ่าน OAuth
  if (!user.passwordHash) {
    throw new Error(
      `บัญชีนี้เชื่อมกับ ${user.provider || 'OAuth'} — กรุณาเข้าสู่ระบบด้วย ${user.provider || 'OAuth'}`,
    );
  }

  // เช็คว่ารหัสผ่านถูกต้องหรือไม่
  const isPasswordValid = await comparePassword(
    data.password,
    user.passwordHash,
  );

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

/**
 * Get user by ID (สำหรับ GET /api/auth/me)
 * @param userId - User ID from JWT token
 * @returns User object
 */
export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
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

/**
 * Forgot Password — สร้าง reset token ให้กับอีเมลที่ระบุ
 *
 * ในโหมด production: ควรส่ง token ทางอีเมล (nodemailer / resend)
 * ในโหมด development: return token กลับใน response ตรงๆ เพื่อทดสอบง่าย
 *
 * @param email - อีเมลที่ต้องการ reset
 * @returns { resetToken, expiresInMinutes }
 */
export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // ✅ ไม่บอกว่า email มีหรือไม่ → ป้องกัน user enumeration attack
  if (!user) {
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // OAuth-only user ไม่มี password → ไม่สามารถ reset ได้
  if (!user.passwordHash) {
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  const resetToken = signResetToken(user.id);

  // ส่งอีเมลจริงด้วย Resend (ถ้าตั้งค่า RESEND_API_KEY ไว้)
  // ใน Development ถ้าไม่มี API key → ข้ามการส่ง แต่ยังคืน token ใน response
  const hasResendKey = Boolean(process.env.RESEND_API_KEY);
  if (hasResendKey) {
    await sendPasswordResetEmail(user.email, resetToken);
  }

  // Dev: return token ใน response เพื่อทดสอบ (เฉพาะเมื่อไม่มี Resend key หรือ NODE_ENV=development)
  // ✅ ใช้ strict check: === 'development' ไม่ใช่ !== 'production'
  //    ป้องกันกรณีที่ NODE_ENV ไม่ได้ตั้งค่า หรือเป็น 'staging' → token จะไม่รั่ว
  const isDev = process.env.NODE_ENV === 'development';
  return {
    message: 'If that email exists, a reset link has been sent.',
    // แสดง token ใน response เฉพาะ dev mode ที่ไม่มี Resend key (เพื่อทดสอบ)
    ...(isDev && !hasResendKey && { resetToken, expiresInMinutes: 15 }),
  };
};

/**
 * Reset Password — ตรวจสอบ token แล้วเปลี่ยนรหัสผ่าน
 *
 * @param token - JWT reset token (จาก query string / body)
 * @param newPassword - รหัสผ่านใหม่ (ต้องมีอย่างน้อย 8 ตัวอักษร)
 */
export const resetPassword = async (token: string, newPassword: string) => {
  // 1. ตรวจสอบ token (throws ถ้า invalid/expired)
  const userId = verifyResetToken(token);

  // 2. หา user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found.');
  }

  // 3. ป้องกัน OAuth-only user
  if (!user.passwordHash) {
    throw new Error('This account uses OAuth login and cannot reset password.');
  }

  // 4. Hash รหัสผ่านใหม่
  const hashedPassword = await hashPassword(newPassword);

  // 5. อัปเดต DB
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  return { message: 'Password has been reset successfully.' };
};
