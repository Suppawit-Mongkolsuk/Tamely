import { prisma } from '../../index';
import { MentionTargetType, WorkspaceRole } from '@prisma/client';

/* ======================= SELECTS ======================= */

const senderSelect = { id: true, Name: true, avatarUrl: true } as const;
const postSelect = { id: true, title: true, body: true } as const;
const commentSelect = { id: true, content: true } as const;

/* ======================= CREATE ======================= */

export const createMany = async (
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
  if (notifications.length === 0) return;

  return prisma.notification.createMany({
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
      include: {
        sender: { select: senderSelect },
        post: { select: postSelect },
        comment: { select: commentSelect },
      },
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
  return prisma.notification.findUnique({ where: { id } });
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
      user: { Name: { in: names, mode: 'insensitive' } },
    },
    include: { user: { select: { id: true, Name: true } } },
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
    include: { user: { select: { id: true, Name: true } } },
  });
};
