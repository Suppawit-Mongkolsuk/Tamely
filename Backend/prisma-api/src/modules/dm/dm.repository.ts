import { prisma } from '../../index';
import { MessageType } from '@prisma/client';

/* ======================= SELECTS ======================= */

const userSelect = { id: true, Name: true, avatarUrl: true } as const;

/* ======================= CONVERSATION ======================= */

/**
 * หา conversation ที่มีอยู่แล้ว หรือสร้างใหม่
 * userAId/userBId ถูกเรียงตาม alphabetical เพื่อป้องกัน duplicate pair
 */
export const findOrCreateConversation = async (
  workspaceId: string,
  userId1: string,
  userId2: string,
) => {
  // เรียง ID ตาม alphabetical เพื่อให้ unique constraint ทำงานถูกต้อง
  const [userAId, userBId] = [userId1, userId2].sort();

  const existing = await prisma.directConversation.findUnique({
    where: { workspaceId_userAId_userBId: { workspaceId, userAId, userBId } },
    include: {
      userA: { select: userSelect },
      userB: { select: userSelect },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: userSelect } },
      },
    },
  });

  if (existing) return existing;

  return prisma.directConversation.create({
    data: { workspaceId, userAId, userBId },
    include: {
      userA: { select: userSelect },
      userB: { select: userSelect },
      messages: false,
    },
  });
};

export const findConversationById = async (conversationId: string) => {
  return prisma.directConversation.findUnique({
    where: { id: conversationId },
    include: {
      userA: { select: userSelect },
      userB: { select: userSelect },
    },
  });
};

/**
 * ดึง list ของ conversation ทั้งหมดที่ user มีอยู่ใน workspace นี้
 * พร้อม last message และ unread count
 */
export const findConversationsByUser = async (workspaceId: string, userId: string) => {
  return prisma.directConversation.findMany({
    where: {
      workspaceId,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: { select: userSelect },
      userB: { select: userSelect },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: userSelect } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

/* ======================= MESSAGES ======================= */

export const findMessages = async (
  conversationId: string,
  options: { limit: number; offset: number; before?: string },
) => {
  const where: Record<string, unknown> = { conversationId };
  if (options.before) {
    where.createdAt = { lt: new Date(options.before) };
  }

  const [messages, total] = await Promise.all([
    prisma.directMessage.findMany({
      where,
      include: { sender: { select: userSelect } },
      orderBy: { createdAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    }),
    prisma.directMessage.count({ where }),
  ]);

  return { messages: messages.reverse(), total };
};

export const createMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  type: MessageType = MessageType.TEXT,
  fileData?: { fileUrl: string; fileName: string; fileSize: number },
) => {
  const [message] = await prisma.$transaction([
    prisma.directMessage.create({
      data: {
        conversationId,
        senderId,
        content,
        type,
        fileUrl: fileData?.fileUrl ?? null,
        fileName: fileData?.fileName ?? null,
        fileSize: fileData?.fileSize ?? null,
      },
      include: { sender: { select: userSelect } },
    }),
    // อัพเดต updatedAt ของ conversation เพื่อให้ sort ล่าสุดได้ถูกต้อง
    prisma.directConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
  return message;
};

export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  return prisma.directMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: userId }, // mark read เฉพาะข้อความที่คนอื่นส่งมา
      isRead: false,
    },
    data: { isRead: true },
  });
};

export const countUnread = async (conversationId: string, userId: string) => {
  return prisma.directMessage.count({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
  });
};

export const deleteMessage = async (messageId: string) => {
  return prisma.directMessage.delete({ where: { id: messageId } });
};

export const findMessageById = async (messageId: string) => {
  return prisma.directMessage.findUnique({ where: { id: messageId } });
};
