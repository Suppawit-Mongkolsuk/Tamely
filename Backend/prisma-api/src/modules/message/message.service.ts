import { MessageType } from '@prisma/client';
import { AppError } from '../../types';
import { PERMISSIONS } from '../../types/permissions';
import { hasPermission } from '../../utils/permissions';
import * as messageRepository from './message.repository';
import { prisma } from '../../index';
import { pushToUsers } from '../push/push.service';

/* ======================= READ ======================= */

export const getMessages = async (
  roomId: string,
  userId: string,
  options: { limit?: number; offset?: number; before?: string },
) => {
  const room = await messageRepository.findRoom(roomId);
  if (!room) throw new AppError(404, 'Room not found');

  const roomMember = await messageRepository.findRoomMember(roomId, userId);
  if (!roomMember) throw new AppError(403, 'You are not a member of this room');

  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;

  const { messages, total } = await messageRepository.findMany(roomId, {
    limit,
    offset,
    before: options.before,
  });

  if (offset === 0) {
    const latestReadAt = messages[messages.length - 1]?.createdAt ?? new Date();
    await messageRepository.updateRoomReadState(roomId, userId, latestReadAt);
  }

  return { data: messages, total, limit, offset };
};

/* ======================= CREATE ======================= */

export const sendMessage = async (
  roomId: string,
  senderId: string,
  content: string,
  type: MessageType = MessageType.TEXT,
  fileData?: { fileUrl: string; fileName: string; fileSize: number },
) => {
  const room = await messageRepository.findRoom(roomId);
  if (!room) throw new AppError(404, 'Room not found');

  const roomMember = await messageRepository.findRoomMember(roomId, senderId);
  if (!roomMember) throw new AppError(403, 'You are not a member of this room');

  const allowed = await hasPermission(room.workspaceId, senderId, PERMISSIONS.SEND_MESSAGES);
  if (!allowed) throw new AppError(403, 'Insufficient permissions');

  const message = await messageRepository.create(roomId, senderId, content, type, fileData);

  // ส่ง push notification ให้สมาชิกในห้องทุกคน ยกเว้นผู้ส่ง (fire and forget)
  prisma.roomMember.findMany({
    where: { roomId, userId: { not: senderId } },
    select: { userId: true },
  }).then(async (members) => {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { Name: true },
    });
    const memberIds = members.map((m) => m.userId);
    await pushToUsers(
      memberIds,
      room.name ?? 'ห้องแชท',
      `${sender?.Name ?? 'ใครบางคน'}: ${content}`,
      { roomId, type: 'room' },
    );
  }).catch((err) => {
    console.error('[RoomMessage] Failed to send push notifications:', err);
  });

  return message;
};

/* ======================= DELETE ======================= */

export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await messageRepository.findById(messageId);
  if (!message) throw new AppError(404, 'Message not found');
  if (
    message.senderId !== userId &&
    !(await hasPermission(message.room.workspaceId, userId, PERMISSIONS.DELETE_ANY_MESSAGE))
  ) {
    throw new AppError(403, 'Insufficient permissions');
  }

  await messageRepository.remove(messageId);
};

export const markAsRead = async (
  roomId: string,
  userId: string,
  readAt: Date = new Date(),
) => {
  const room = await messageRepository.findRoom(roomId);
  if (!room) throw new AppError(404, 'Room not found');

  const roomMember = await messageRepository.findRoomMember(roomId, userId);
  if (!roomMember) throw new AppError(403, 'You are not a member of this room');

  await messageRepository.updateRoomReadState(roomId, userId, readAt);
};

