import { MentionTargetType, WorkspaceRole } from '@prisma/client';
import { AppError } from '../../types';
import * as notificationRepository from './notification.repository';
import { pushToUsers } from '../push/push.service';
import { getIO } from '../chat/chat.gateway';

/* ======================= CONSTANTS ======================= */

const ROLE_ALIASES: Record<string, WorkspaceRole> = {
  owner: WorkspaceRole.OWNER,
  admin: WorkspaceRole.ADMIN,
  moderator: WorkspaceRole.MODERATOR,
  member: WorkspaceRole.MEMBER,
};

/* ======================= MENTION PARSER ======================= */

export const parseMentions = (
  text: string,
): { userNames: string[]; roleNames: string[] } => {
  const userNames: string[] = [];
  const roleNames: string[] = [];

  const bracketPattern = /@\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = bracketPattern.exec(text)) !== null) {
    const name = match[1].trim();
    if (ROLE_ALIASES[name.toLowerCase()]) {
      roleNames.push(name);
    } else {
      userNames.push(name);
    }
  }

  const cleaned = text.replace(/@\[[^\]]+\]/g, '');
  const wordPattern = /@(\w+)/g;
  while ((match = wordPattern.exec(cleaned)) !== null) {
    const name = match[1].trim();
    if (ROLE_ALIASES[name.toLowerCase()]) {
      roleNames.push(name);
    } else {
      userNames.push(name);
    }
  }

  return {
    userNames: [...new Set(userNames)],
    roleNames: [...new Set(roleNames)],
  };
};

/* ======================= RESOLVE & CREATE NOTIFICATIONS ======================= */

export const processAndCreateMentionNotifications = async (params: {
  workspaceId: string;
  senderId: string;
  senderName: string;
  text: string;
  postId?: string;
  commentId?: string;
  context: 'post' | 'comment';
}) => {
  const { workspaceId, senderId, senderName, text, postId, commentId, context } = params;

  const { userNames, roleNames } = parseMentions(text);

  if (userNames.length === 0 && roleNames.length === 0) return;

  const notifications: {
    workspaceId: string;
    userId: string;
    senderId: string;
    type: MentionTargetType;
    targetRole?: WorkspaceRole;
    postId?: string;
    commentId?: string;
    content: string;
  }[] = [];

  const contextLabel = context === 'post' ? 'โพสต์' : 'คอมเมนต์';

  // 1. Resolve @UserName mentions
  if (userNames.length > 0) {
    const members = await notificationRepository.findMembersByNames(workspaceId, userNames);

    for (const member of members) {
      if (member.userId === senderId) continue;

      notifications.push({
        workspaceId,
        userId: member.userId,
        senderId,
        type: MentionTargetType.USER,
        postId: postId ?? undefined,
        commentId: commentId ?? undefined,
        content: `${senderName} แท็กคุณใน${contextLabel}`,
      });
    }
  }

  // 2. Resolve @Role mentions
  if (roleNames.length > 0) {
    const resolvedRoles = roleNames
      .map((name) => ROLE_ALIASES[name.toLowerCase()])
      .filter((r): r is WorkspaceRole => r !== undefined);

    if (resolvedRoles.length > 0) {
      const members = await notificationRepository.findMembersByRoles(workspaceId, resolvedRoles);
      const existingUserIds = new Set(notifications.map((n) => n.userId));

      for (const member of members) {
        if (member.userId === senderId) continue;
        if (existingUserIds.has(member.userId)) continue;

        const roleName = resolvedRoles.find((r) => r === member.role);
        if (!roleName) continue;

        notifications.push({
          workspaceId,
          userId: member.userId,
          senderId,
          type: MentionTargetType.ROLE,
          targetRole: member.role,
          postId: postId ?? undefined,
          commentId: commentId ?? undefined,
          content: `${senderName} แท็ก @${roleName} ใน${contextLabel}`,
        });

        existingUserIds.add(member.userId);
      }
    }
  }

  // 3. Batch insert + notify
  if (notifications.length > 0) {
    await notificationRepository.createMany(notifications);

    const receiverIds = [...new Set(notifications.map((n) => n.userId))];

    // push notification (fire and forget)
    pushToUsers(
      receiverIds,
      'มีการแท็กถึงคุณ',
      `${senderName} แท็กคุณใน${contextLabel}`,
      { type: 'mention' },
    ).catch((err) => {
      console.error('[Notification] Failed to send mention push notification:', err);
    });

    // in-app notification ผ่าน socket สำหรับ user ที่แอปเปิดอยู่
    const io = getIO();
    if (io) {
      for (const notif of notifications) {
        io.to(`user:${notif.userId}`).emit('new_notification', {
          id: `${Date.now()}-${notif.userId}`,
          senderName,
          content: notif.content,
        });
      }
    }
  }

  return notifications;
};

/* ======================= READ ======================= */

export const getNotifications = async (
  userId: string,
  workspaceId: string,
  options: { limit?: number; offset?: number; unreadOnly?: boolean },
) => {
  const limit = Math.min(options.limit ?? 20, 50);
  const offset = options.offset ?? 0;
  const unreadOnly = options.unreadOnly ?? false;

  return notificationRepository.findMany(userId, workspaceId, {
    limit,
    offset,
    unreadOnly,
  });
};

/* ======================= MARK READ ======================= */

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await notificationRepository.findById(notificationId);
  if (!notification) throw new AppError(404, 'Notification not found');
  if (notification.userId !== userId) {
    throw new AppError(403, 'You can only mark your own notifications as read');
  }

  return notificationRepository.markRead(notificationId);
};

export const markAllAsRead = async (userId: string, workspaceId: string) => {
  return notificationRepository.markAllRead(userId, workspaceId);
};
