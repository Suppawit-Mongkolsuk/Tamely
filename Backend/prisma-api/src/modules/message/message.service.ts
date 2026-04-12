import { MessageType } from '@prisma/client';
import { AppError } from '../../types';
import * as messageRepository from './message.repository';

/* ======================= READ ======================= */

export const getMessages = async (
  roomId: string,
  userId: string,
  options: { limit?: number; offset?: number; before?: string },
) => {
  const room = await messageRepository.findRoom(roomId);
  if (!room) throw new AppError(404, 'Room not found');

  // ตรวจสอบว่าเป็น RoomMember (ถ้าถูกเตะออกจะไม่มีสิทธิ์อ่านข้อความ)
  const roomMember = await messageRepository.findRoomMember(roomId, userId);
  if (!roomMember) throw new AppError(403, 'You are not a member of this room');

  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;

  const { messages, total } = await messageRepository.findMany(roomId, {
    limit,
    offset,
    before: options.before,
  });

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

  // ตรวจสอบว่าเป็น RoomMember (ถ้าถูกเตะออกจะส่งข้อความไม่ได้)
  const roomMember = await messageRepository.findRoomMember(roomId, senderId);
  if (!roomMember) throw new AppError(403, 'You are not a member of this room');

  return messageRepository.create(roomId, senderId, content, type, fileData);
};

/* ======================= DELETE ======================= */

export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await messageRepository.findById(messageId);
  if (!message) throw new AppError(404, 'Message not found');
  if (message.senderId !== userId) {
    throw new AppError(403, 'You can only delete your own messages');
  }

  await messageRepository.remove(messageId);
};
