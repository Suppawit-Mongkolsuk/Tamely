// ===== OAuth Service =====
// หา user จาก OAuth provider หรือสร้างใหม่

import { prisma } from '../../index';

interface OAuthUserData {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * หา user ที่เชื่อมกับ OAuth provider นี้ หรือสร้างใหม่
 * - ถ้า provider + providerId ตรงกัน → return user เดิม
 * - ถ้า email ตรงกัน (เคยสมัครด้วย password) → link OAuth เข้ากับ user เดิม
 * - ถ้าไม่มีเลย → สร้าง user ใหม่ (ไม่มี password)
 */
export const findOrCreateOAuthUser = async (data: OAuthUserData) => {
  // 1. หาจาก provider + providerId
  const existingOAuth = await prisma.user.findFirst({
    where: {
      provider: data.provider,
      providerId: data.providerId,
    },
  });

  if (existingOAuth) {
    return {
      id: existingOAuth.id,
      email: existingOAuth.email,
      displayName: existingOAuth.Name,
      avatarUrl: existingOAuth.avatarUrl,
    };
  }

  // 2. หาจาก email (อาจเคยสมัครด้วย password)
  const existingEmail = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingEmail) {
    // Link OAuth เข้ากับ user เดิม (ไม่ลบ password เก่า)
    const updated = await prisma.user.update({
      where: { id: existingEmail.id },
      data: {
        provider: data.provider,
        providerId: data.providerId,
        avatarUrl: existingEmail.avatarUrl || data.avatarUrl,
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.Name,
      avatarUrl: updated.avatarUrl,
    };
  }

  // 3. สร้าง user ใหม่ (ไม่มี password — OAuth only)
  const newUser = await prisma.user.create({
    data: {
      email: data.email,
      Name: data.name,
      avatarUrl: data.avatarUrl,
      provider: data.provider,
      providerId: data.providerId,
      // passwordHash เป็น null → login ด้วย password ไม่ได้
    },
  });

  return {
    id: newUser.id,
    email: newUser.email,
    displayName: newUser.Name,
    avatarUrl: newUser.avatarUrl,
  };
};
