import { prisma } from '../../index';
import { MentionTargetType, WorkspaceRole } from '@prisma/client';

/* ======================= SELECTS ======================= */

const senderSelect = { id: true, Name: true, avatarUrl: true } as const;
const postSelect = { id: true, title: true } as const;
const commentSelect = { id: true, content: true } as const;
const notificationSelect = {
  id: true,
  type: true,
  targetRole: true,
  content: true,
  isRead: true,
  createdAt: true,
  sender: { select: senderSelect },
  post: { select: postSelect },
  comment: { select: commentSelect },
} as const;

/* ======================= CREATE ======================= */

export const createMany = async ( // ฟังก์ชันนี้ใช้สำหรับสร้าง notification หลายรายการในครั้งเดียว โดยรับข้อมูลเป็น array ของ notification ที่ต้องการสร้าง
  notifications: {
    workspaceId: string;
    userId: string;
    senderId: string;
    type: MentionTargetType;
    targetRole?: WorkspaceRole;
    postId?: string;
    commentId?: string;
    content: string;
  }[],
) => {
  if (notifications.length === 0) return; // ถ้าไม่มี notification ที่ต้องสร้าง ก็ไม่ต้องทำอะไร

  return prisma.notification.createMany({ // ส่งออกคำสั่งสร้าง notification หลายรายการในครั้งเดียว
    data: notifications,
    skipDuplicates: true,
  });
};

/* ======================= READ ======================= */

export const findMany = async (
  userId: string,
  workspaceId: string,
  options: { limit: number; offset: number; unreadOnly: boolean },
) => {
  const where = {
    userId,
    workspaceId,
    ...(options.unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      select: notificationSelect,
      orderBy: { createdAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, workspaceId, isRead: false },
    }),
  ]);

  return { notifications, total, unreadCount };
};

export const findById = async (id: string) => {
  return prisma.notification.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
};

/* ======================= UPDATE ======================= */

export const markRead = async (id: string) => {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

export const markAllRead = async (userId: string, workspaceId: string) => {
  return prisma.notification.updateMany({
    where: { userId, workspaceId, isRead: false },
    data: { isRead: true },
  });
};

/* ======================= HELPERS (ใช้ใน mention resolution) ======================= */

/**
 * ค้นหา workspace members ตามชื่อ (สำหรับ resolve @Name)
 */
export const findMembersByNames = async (
  workspaceId: string,
  names: string[],
) => {
  if (names.length === 0) return [];

  return prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      user: { Name: { in: names, mode: 'insensitive' } }, // ค้นหาชื่อผู้ใช้ที่ตรงกับที่ถูก @mention โดยไม่สนใจตัวพิมพ์เล็ก/ใหญ่
    },
    select: { userId: true },
  });
};

/**
 * ค้นหา workspace members ตามยศ (สำหรับ resolve @Admin, @Moderator ฯลฯ)
 */
export const findMembersByRoles = async (
  workspaceId: string,
  roles: WorkspaceRole[],
) => {
  if (roles.length === 0) return [];

  return prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      role: { in: roles },
    },
    select: { userId: true, role: true },
  });
};
