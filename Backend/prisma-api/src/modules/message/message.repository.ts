import { prisma } from '../../index';
import { MessageType } from '@prisma/client';

/* ======================= SELECTS ======================= */

const senderSelect = { id: true, Name: true, avatarUrl: true } as const;

/* ======================= READ ======================= */

export const findMany = async (
  roomId: string,
  options: { limit: number; offset: number; before?: string },
) => {
  const where: Record<string, unknown> = { roomId };
  if (options.before) {
    where.createdAt = { lt: new Date(options.before) };
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: { sender: { select: senderSelect } },
      orderBy: { createdAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    }),
    prisma.message.count({ where }),
  ]);

  return { messages: messages.reverse(), total };
};

/* ======================= CREATE ======================= */

export const create = async (
  roomId: string,
  senderId: string,
  content: string,
  type: MessageType = MessageType.TEXT,
  fileData?: { fileUrl: string; fileName: string; fileSize: number },
) => {
  return prisma.message.create({
    data: {
      roomId,
      senderId,
      content,
      type,
      ...(fileData ?? {}),
    },
    include: { sender: { select: senderSelect } },
  });
};

/* ======================= READ ONE ======================= */

export const findById = async (messageId: string) => {
  return prisma.message.findUnique({
    where: { id: messageId },
  });
};

/* ======================= DELETE ======================= */

export const remove = async (messageId: string) => {
  return prisma.message.delete({ where: { id: messageId } });
};

/* ======================= ROOM ======================= */

export const findRoom = async (roomId: string) => {
  return prisma.room.findUnique({ where: { id: roomId } });
};

export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
};

export const findRoomMember = async (roomId: string, userId: string) => {
  return prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
};
