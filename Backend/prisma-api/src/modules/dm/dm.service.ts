import { AppError } from '../../types';
import * as dmRepository from './dm.repository';
import { prisma } from '../../index';
import { MessageType } from '@prisma/client';
import { deleteFromStorage, CHAT_FILES_BUCKET } from '../../utils/supabase-storage';

/* ======================= HELPERS ======================= */

const assertWorkspaceMember = async (workspaceId: string, userId: string) => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) throw new AppError(403, 'You are not a member of this workspace');
  return member;
};

const assertConversationParticipant = (
  conversation: { userAId: string; userBId: string },
  userId: string,
) => {
  if (conversation.userAId !== userId && conversation.userBId !== userId) {
    throw new AppError(403, 'You are not a participant of this conversation');
  }
};

/* ======================= OPEN / GET CONVERSATION ======================= */

/**
 * เปิด DM กับ user อีกคน — ถ้ามีอยู่แล้วให้ return เดิม, ถ้าไม่มีให้สร้างใหม่
 */
export const openConversation = async (
  workspaceId: string,
  userId: string,
  targetUserId: string,
) => {
  if (userId === targetUserId) {
    throw new AppError(400, 'ไม่สามารถส่ง DM หาตัวเองได้');
  }

  await assertWorkspaceMember(workspaceId, userId);
  await assertWorkspaceMember(workspaceId, targetUserId);

  return dmRepository.findOrCreateConversation(workspaceId, userId, targetUserId);
};

/**
 * ดึง list DM conversations ของ user ใน workspace
 */
export const getConversations = async (workspaceId: string, userId: string) => {
  await assertWorkspaceMember(workspaceId, userId);

  const conversations = await dmRepository.findConversationsByUser(workspaceId, userId);

  // เพิ่ม unread count ให้แต่ละ conversation
  const withUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unread = await dmRepository.countUnread(conv.id, userId);
      const lastMsg = conv.messages[0] ?? null;
      return { ...conv, unreadCount: unread, lastMessage: lastMsg };
    }),
  );

  return withUnread;
};

/* ======================= MESSAGES ======================= */

export const getMessages = async (
  conversationId: string,
  userId: string,
  options: { limit?: number; offset?: number; before?: string },
) => {
  const conv = await dmRepository.findConversationById(conversationId);
  if (!conv) throw new AppError(404, 'Conversation not found');
  assertConversationParticipant(conv, userId);

  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;

  const { messages, total } = await dmRepository.findMessages(conversationId, {
    limit,
    offset,
    before: options.before,
  });

  // mark as read เมื่อ fetch
  await dmRepository.markMessagesAsRead(conversationId, userId);

  return { data: messages, total, limit, offset };
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  type: MessageType = MessageType.TEXT,
  fileData?: { fileUrl: string; fileName: string; fileSize: number },
) => {
  const conv = await dmRepository.findConversationById(conversationId);
  if (!conv) throw new AppError(404, 'Conversation not found');
  assertConversationParticipant(conv, senderId);

  return dmRepository.createMessage(conversationId, senderId, content, type, fileData);
};

export const deleteMessage = async (messageId: string, userId: string) => {
  const msg = await dmRepository.findMessageById(messageId);
  if (!msg) throw new AppError(404, 'Message not found');
  if (msg.senderId !== userId) {
    throw new AppError(403, 'You can only delete your own messages');
  }

  // ลบไฟล์จาก Supabase Storage ก่อน (ถ้าเป็นข้อความที่แนบไฟล์)
  if (msg.fileUrl) {
    await deleteFromStorage(CHAT_FILES_BUCKET, msg.fileUrl);
  }

  await dmRepository.deleteMessage(messageId);
};

export const clearMessages = async (conversationId: string, userId: string) => {
  const conv = await dmRepository.findConversationById(conversationId);
  if (!conv) throw new AppError(404, 'Conversation not found');
  assertConversationParticipant(conv, userId);

  // ลบไฟล์ใน Supabase Storage ก่อน
  const msgs = await dmRepository.findAllMessagesWithFiles(conversationId);
  await Promise.all(
    msgs
      .filter((m) => m.fileUrl)
      .map((m) => deleteFromStorage(CHAT_FILES_BUCKET, m.fileUrl!)),
  );

  await dmRepository.deleteAllMessages(conversationId);
};

export const markAsRead = async (conversationId: string, userId: string) => {
  const conv = await dmRepository.findConversationById(conversationId);
  if (!conv) throw new AppError(404, 'Conversation not found');
  assertConversationParticipant(conv, userId);
  await dmRepository.markMessagesAsRead(conversationId, userId);
};
