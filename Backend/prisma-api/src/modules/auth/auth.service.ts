import { prisma } from '../../index';
import { RegisterPayload, LoginPayload } from '../../types';
import { hashPassword, comparePassword } from '../../utils/password.hash';

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
