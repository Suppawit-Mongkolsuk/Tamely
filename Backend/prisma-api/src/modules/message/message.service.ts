import { MessageType } from '@prisma/client';
import { AppError } from '../../types';
import { PERMISSIONS } from '../../types/permissions';
import { hasPermission } from '../../utils/permissions';
import * as messageRepository from './message.repository';
import { prisma } from '../../index';
import { pushToUsers } from '../push/push.service';
import { assertWorkspaceActive } from '../../utils/workspace.helpers';

/* ======================= READ ======================= */

export const getMessages = async ( // ฟังก์ชันนี้จะถูกเรียกเมื่อมีการดึงข้อความในห้องแชท
  roomId: string,
  userId: string,
  options: { limit?: number; offset?: number; before?: string },
) => {
  const room = await messageRepository.findRoom(roomId);
  if (!room) throw new AppError(404, 'Room not found'); // ตรวจสอบว่าห้องแชทที่ต้องการดึงข้อความมีอยู่จริงหรือไม่
  await assertWorkspaceActive(room.workspaceId);// ตรวจสอบว่า workspace ที่ห้องนี้อยู่ยัง active อยู่หรือไม่

  const roomMember = await messageRepository.findRoomMember(roomId, userId);
  if (!roomMember) throw new AppError(403, 'You are not a member of this room');

  const limit = Math.min(options.limit ?? 50, 100); // กำหนดค่าเริ่มต้นของ limit เป็น 50 และจำกัดไม่ให้เกิน 100 เพื่อป้องกันการดึงข้อมูลจำนวนมากเกินไปในครั้งเดียว
  const offset = options.offset ?? 0;

  const { messages, total } = await messageRepository.findMany(roomId, { // ดึงข้อความในห้องแชทตามเงื่อนไขที่กำหนด เช่น limit, offset 
    limit,
    offset,
    before: options.before, // ถ้ามีการระบุค่า before จะดึงข้อความที่สร้างก่อนเวลาที่ระบุเท่านั้น เพื่อให้สามารถทำ pagination แบบเลื่อนลงไปดูข้อความเก่าได้
  });

  if (offset === 0) { // ถ้าเป็นการดึงหน้าข้อมูลแรก (offset = 0) ให้ถือว่าผู้ใช้ได้ดูข้อความล่าสุดแล้ว จึงอัปเดตสถานะการอ่านของห้องแชทนี้ให้เป็นล่าสุด
    const latestReadAt = messages[messages.length - 1]?.createdAt ?? new Date(); // กำหนดเวลาอ่านล่าสุดเป็นเวลาของข้อความสุดท้ายที่ดึงมา 
    await messageRepository.updateRoomReadState(roomId, userId, latestReadAt);
  }

  return { data: messages, total, limit, offset }; // ส่งกลับข้อมูลข้อความที่ดึงมา พร้อมกับข้อมูล pagination เช่น total, limit และ offset เพื่อให้ client สามารถแสดงผลได้อย่างถูกต้อง
};

/* ======================= CREATE ======================= */

export const sendMessage = async ( // ฟังก์ชันนี้จะถูกเรียกเมื่อมีการส่งข้อความในห้องแชท
  roomId: string,
  senderId: string,
  content: string,
  type: MessageType = MessageType.TEXT,
  fileData?: { fileUrl: string; fileName: string; fileSize: number },
) => {
  if (!content || content.trim().length === 0) { // ตรวจสอบว่าข้อความไม่ว่างเปล่า
    throw new AppError(400, 'Message content cannot be empty');
  }
  if (content.length > 4000) { // ตรวจสอบว่าข้อความไม่ยาวเกินไป
    throw new AppError(400, 'Message content cannot exceed 4000 characters');
  }

  const room = await messageRepository.findRoom(roomId); // ตรวจสอบว่าห้องแชทที่ส่งข้อความไปมีอยู่จริงหรือไม่
  if (!room) throw new AppError(404, 'Room not found');
  await assertWorkspaceActive(room.workspaceId); // ตรวจสอบว่า workspace ที่ห้องนี้อยู่ยัง active อยู่หรือไม่

  const roomMember = await messageRepository.findRoomMember(roomId, senderId); // ตรวจสอบว่าผู้ส่งเป็นสมาชิกของห้องนี้หรือไม่
  if (!roomMember) throw new AppError(403, 'You are not a member of this room');

  const allowed = await hasPermission(room.workspaceId, senderId, PERMISSIONS.SEND_MESSAGES); // ตรวจสอบว่าผู้ส่งมีสิทธิ์ในการส่งข้อความใน workspace นี้หรือไม่
  if (!allowed) throw new AppError(403, 'Insufficient permissions');

  const message = await messageRepository.create(roomId, senderId, content, type, fileData); // สร้างข้อความใหม่ในห้องแชทพร้อมบันทึกลงฐานข้อมูล

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

  return { ...message, roomName: room.name };// ส่งกลับข้อมูลข้อความที่ถูกสร้างใหม่พร้อมชื่อห้องแชทเพื่อให้ client สามารถแสดงได้ทันที
};

/* ======================= DELETE ======================= */

export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await messageRepository.findById(messageId);
  if (!message) throw new AppError(404, 'Message not found');
  await assertWorkspaceActive(message.room.workspaceId);
  if (
    message.senderId !== userId &&
    !(await hasPermission(message.room.workspaceId, userId, PERMISSIONS.DELETE_ANY_MESSAGE))
  ) {
    throw new AppError(403, 'Insufficient permissions');
  }

  await messageRepository.remove(messageId);
};

export const markAsRead = async ( // ฟังก์ชันนี้จะถูกเรียกเมื่อมีการอัปเดตสถานะการอ่านของห้องแชทนี้ให้เป็นล่าสุด (ใช้เมื่อ user เปิดห้องแชทนี้แล้ว เพื่อให้รู้ว่าข้อความไหนที่อ่านแล้วบ้าง)
  roomId: string,
  userId: string,
  readAt: Date = new Date(),
) => {
  const room = await messageRepository.findRoom(roomId);
  if (!room) throw new AppError(404, 'Room not found');
  await assertWorkspaceActive(room.workspaceId);

  const roomMember = await messageRepository.findRoomMember(roomId, userId);
  if (!roomMember) throw new AppError(403, 'You are not a member of this room');

  await messageRepository.updateRoomReadState(roomId, userId, readAt) ;// อัปเดตสถานะการอ่านของห้องแชทนี้ให้เป็นเวลาที่ระบุ (โดยปกติจะใช้เวลาปัจจุบัน) เพื่อให้รู้ว่าข้อความไหนที่อ่านแล้วบ้าง
};
