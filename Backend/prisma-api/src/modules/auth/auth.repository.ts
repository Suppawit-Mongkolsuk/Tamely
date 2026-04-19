import { prisma } from '../../index';

/* ======================= SELECTS ======================= */

const userPublicSelect = {
  id: true,
  email: true,
  Name: true,
  avatarUrl: true,
  bio: true,
  lastSeenAt: true,
} as const;

/* ======================= CREATE ======================= */

export const createUser = async (data: {
  email: string;
  passwordHash: string;
  name: string;
}) => {
  return prisma.user.create({ // สร้าง user ใหม่ใน DB
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      Name: data.name,
    },
  });
};

/* ======================= READ ======================= */

export const findByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findById = async (userId: string) => { // หา user โดยใช้ ID
  return prisma.user.findUnique({ where: { id: userId } });
};

/* ======================= UPDATE ======================= */

export const updateUser = async ( // อัพเดตข้อมูล user ทั่วไป 
  userId: string,
  data: Record<string, unknown>,
) => {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
};

export const updatePassword = async (userId: string, passwordHash: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
};

export const updateAvatar = async (userId: string, avatarUrl: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });
};
