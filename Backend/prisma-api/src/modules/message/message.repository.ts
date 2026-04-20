import { prisma } from '../../index';
import { MessageType } from '@prisma/client';

/* ======================= SELECTS ======================= */

const senderSelect = { id: true, Name: true, avatarUrl: true } as const;
const messageSelect = {
  id: true,
  content: true,
  type: true,
  createdAt: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  sender: { select: senderSelect },
} as const;

/* ======================= READ ======================= */

export const findMany = async ( // ฟังก์ชันนี้ใช้สำหรับดึงข้อความในห้องแชท โดยสามารถระบุเงื่อนไขต่างๆ เช่น limit, offset และ before เพื่อทำ pagination ได้
  roomId: string,
  options: { limit: number; offset: number; before?: string },
) => {
  const where: Record<string, unknown> = { roomId };
  if (options.before) { // ถ้าระบุ ค่า before จะเพิ่มเงื่อนไขในการดึงข้อความที่สร้างก่อนเวลาที่ระบุเท่านั้น
    where.createdAt = { lt: new Date(options.before) };
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({ // ดึงข้อความจากฐานข้อมูลตามเงื่อนไขที่กำหนด
      where,
      select: messageSelect,
      orderBy: { createdAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    }),
    prisma.message.count({ where }), // นับจำนวนข้อความทั้งหมดที่ตรงกับเงื่อนไข 
  ]);

  return { messages: messages.reverse(), total }; // เนื่องจากดึงข้อความมาเรียงจากใหม่ไปเก่า จึงต้อง reverse กลับเพื่อให้แสดงผลจากเก่าไปใหม่
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
    select: messageSelect,
  });
};

/* ======================= READ ONE ======================= */

export const findById = async (messageId: string) => {
  return prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      senderId: true,
      room: {
        select: {
          workspaceId: true,
        },
      },
    },
  });
};

/* ======================= DELETE ======================= */

export const remove = async (messageId: string) => {
  return prisma.message.delete({ where: { id: messageId } });
};

/* ======================= ROOM ======================= */

export const findRoom = async (roomId: string) => {
  return prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, workspaceId: true ,name: true },

  });
};

export const findRoomMember = async (roomId: string, userId: string) => { // ตรวจสอบว่าผู้ใช้เป็นสมาชิกของห้องแชทนี้หรือไม่ และดึงข้อมูลการอ่านล่าสุดของผู้ใช้ในห้องนี้
  return prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { roomId: true, userId: true, lastReadAt: true },
  });
};

export const updateRoomReadState = async (
  roomId: string,
  userId: string,
  readAt: Date,
) => {
  return prisma.roomMember.updateMany({
    where: {
      roomId,
      userId,
      lastReadAt: { lt: readAt },
    },
    data: { lastReadAt: readAt },
  });
};
