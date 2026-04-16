import { prisma } from '../../index';
import { MessageType } from '@prisma/client';

/* ======================= SELECTS ======================= */

const userSelect = { id: true, Name: true, avatarUrl: true } as const;
const previewSenderSelect = { id: true, Name: true } as const;
const lastMessageSelect = {
  content: true,
  type: true,
  createdAt: true,
  sender: { select: previewSenderSelect },
} as const;
const conversationSelect = {
  id: true,
  userA: { select: userSelect },
  userB: { select: userSelect },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: lastMessageSelect,
  },
} as const;
const dmMessageSelect = {
  id: true,
  content: true,
  type: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  createdAt: true,
  sender: { select: userSelect },
} as const;

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
    select: conversationSelect,
  });

  if (existing) return existing;

  return prisma.directConversation.create({
    data: { workspaceId, userAId, userBId },
    select: conversationSelect,
  });
};

export const findConversationById = async (conversationId: string) => {
  return prisma.directConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userAId: true, userBId: true },
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
    select: conversationSelect,
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
      select: dmMessageSelect,
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
      select: dmMessageSelect,
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

export const findAllMessagesWithFiles = async (conversationId: string) => {
  return prisma.directMessage.findMany({
    where: { conversationId },
    select: { id: true, fileUrl: true },
  });
};

export const deleteAllMessages = async (conversationId: string) => {
  return prisma.directMessage.deleteMany({ where: { conversationId } });
};

export const findMessageById = async (messageId: string) => {
  return prisma.directMessage.findUnique({
    where: { id: messageId },
    select: { id: true, senderId: true, fileUrl: true },
  });
};
