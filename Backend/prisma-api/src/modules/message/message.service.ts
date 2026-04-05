import { prisma } from '../../index';
import { MessageType } from '@prisma/client';

const senderSelect = {
  id: true,
  Name: true,
  avatarUrl: true,
} as const;

export const getMessages = async (
  roomId: string,
  userId: string,
  options: { limit?: number; offset?: number; before?: string },
) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: room.workspaceId, userId },
    },
  });
  if (!member) throw new Error('You are not a member of this workspace');

  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;

  const where: Record<string, unknown> = { roomId };
  if (options.before) {
    where.createdAt = { lt: new Date(options.before) };
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: { sender: { select: senderSelect } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.message.count({ where }),
  ]);

  return { data: messages.reverse(), total, limit, offset };
};

export const sendMessage = async (
  roomId: string,
  senderId: string,
  content: string,
  type: MessageType = MessageType.TEXT,
) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: room.workspaceId, userId: senderId },
    },
  });
  if (!member) throw new Error('You are not a member of this workspace');

  return prisma.message.create({
    data: { roomId, senderId, content, type },
    include: { sender: { select: senderSelect } },
  });
};

export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) throw new Error('Message not found');
  if (message.senderId !== userId) {
    throw new Error('You can only delete your own messages');
  }

  await prisma.message.delete({ where: { id: messageId } });
};
