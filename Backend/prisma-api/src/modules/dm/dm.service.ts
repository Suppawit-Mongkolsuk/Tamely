import { AppError } from '../../types';
import * as dmRepository from './dm.repository';
import { prisma } from '../../index';
import { MessageType } from '@prisma/client';
import { deleteFromStorage, CHAT_FILES_BUCKET } from '../../utils/supabase-storage';
import { pushToUsers } from '../push/push.service';
import { assertWorkspaceActive, assertWorkspaceMember } from '../../utils/workspace.helpers';

const assertConversationParticipant = (
  conversation: { userAId: string; userBId: string },
  userId: string,
) => {
  if (conversation.userAId !== userId && conversation.userBId !== userId) {
    throw new AppError(403, 'You are not a participant of this conversation');
  }
};

/* ======================= OPEN / GET CONVERSATION ======================= */

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

export const getConversations = async (workspaceId: string, userId: string) => {
  await assertWorkspaceMember(workspaceId, userId);

  const conversations = await dmRepository.findConversationsByUser(workspaceId, userId);
  const unreadMap = await dmRepository.countUnreadByConversationIds(
    userId,
    conversations.map((conversation) => conversation.id),
  );

  return conversations.map((conv) => {
    const lastMsg = conv.messages[0] ?? null;
    return { ...conv, unreadCount: unreadMap.get(conv.id) ?? 0, lastMessage: lastMsg };
  });
};

/* ======================= MESSAGES ======================= */

export const getMessages = async (
  conversationId: string,
  userId: string,
  options: { limit?: number; offset?: number; before?: string },
) => {
  const conv = await dmRepository.findConversationById(conversationId);
  if (!conv) throw new AppError(404, 'Conversation not found');
  await assertWorkspaceActive(conv.workspaceId);
  assertConversationParticipant(conv, userId);

  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;

  const { messages, total } = await dmRepository.findMessages(conversationId, {
    limit,
    offset,
    before: options.before,
  });

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
  await assertWorkspaceActive(conv.workspaceId);
  assertConversationParticipant(conv, senderId);

  const message = await dmRepository.createMessage(conversationId, senderId, content, type, fileData);

  // ส่ง push notification ให้อีกฝ่าย (fire and forget ไม่ block response)
  const receiverId = conv.userAId === senderId ? conv.userBId : conv.userAId;
  prisma.user.findUnique({ where: { id: senderId }, select: { Name: true } })
    .then((sender) => {
      pushToUsers(
        [receiverId],
        sender?.Name ?? 'มีข้อความใหม่',
        content,
        { conversationId, type: 'dm' },
      );
    })
    .catch((err) => {
      console.error('[DM] Failed to send push notification:', err);
    });

  return message;
};

export const deleteMessage = async (messageId: string, userId: string) => {
  const msg = await dmRepository.findMessageById(messageId);
  if (!msg) throw new AppError(404, 'Message not found');
  if (msg.senderId !== userId) {
    throw new AppError(403, 'You can only delete your own messages');
  }

  if (msg.fileUrl) {
    await deleteFromStorage(CHAT_FILES_BUCKET, msg.fileUrl);
  }

  await dmRepository.deleteMessage(messageId);
};

export const clearMessages = async (conversationId: string, userId: string) => {
  const conv = await dmRepository.findConversationById(conversationId);
  if (!conv) throw new AppError(404, 'Conversation not found');
  await assertWorkspaceActive(conv.workspaceId);
  assertConversationParticipant(conv, userId);

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
  await assertWorkspaceActive(conv.workspaceId);
  assertConversationParticipant(conv, userId);
  await dmRepository.markMessagesAsRead(conversationId, userId);
};
