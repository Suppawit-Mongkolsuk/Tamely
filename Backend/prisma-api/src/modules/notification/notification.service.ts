import { MentionTargetType, WorkspaceRole } from '@prisma/client';
import { AppError } from '../../types';
import * as notificationRepository from './notification.repository';
import { pushToUsers } from '../push/push.service';
import { getIO } from '../chat/chat.gateway';

/* ======================= CONSTANTS ======================= */

const ROLE_ALIASES: Record<string, WorkspaceRole> = { // กำหนดชื่อที่ผู้ใช้สามารถพิมพ์เพื่อ @mention บทบาทต่างๆ ใน workspace ได้ โดยแปลงเป็น role จริงที่ระบบใช้
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

export const processAndCreateMentionNotifications = async (params: { // ฟังก์ชันนี้จะถูกเรียกเมื่อมีการสร้างโพสต์หรือคอมเมนต์ใหม่ และมีการ @mention ในข้อความ เพื่อสร้าง notification ให้กับผู้ที่ถูกแท็กถึง
  workspaceId: string;
  senderId: string;
  senderName: string;
  text: string;
  postId?: string;
  commentId?: string;
  context: 'post' | 'comment';
}) => {
  const { workspaceId, senderId, senderName, text, postId, commentId, context } = params;// ดึงข้อมูลที่จำเป็นออกจาก params ที่รับเข้ามา

  const { userNames, roleNames } = parseMentions(text); // แยกชื่อผู้ใช้และชื่อบทบาทที่ถูก @mention ออกจากข้อความ

  if (userNames.length === 0 && roleNames.length === 0) return; // ไม่มีการ @mention ใดๆ ในข้อความ

  const notifications: { // เตรียมข้อมูลสำหรับสร้าง notification หลายรายการในครั้งเดียว
    workspaceId: string;
    userId: string;
    senderId: string;
    type: MentionTargetType;
    targetRole?: WorkspaceRole;
    postId?: string;
    commentId?: string;
    content: string;
  }[] = []; // array ที่จะเก็บข้อมูล notification ที่ต้องสร้าง

  const contextLabel = context === 'post' ? 'โพสต์' : 'คอมเมนต์';

  // 1. Resolve @UserName mentions // ดึงข้อมูลสมาชิกที่มีชื่อผู้ใช้ตรงกับที่ถูก @mention มาเพื่อสร้าง notification
  if (userNames.length > 0) {  // ถ้ามีการ @mention แบบระบุชื่อผู้ใช้ 
    const members = await notificationRepository.findMembersByNames(workspaceId, userNames); // หาสมาชิกใน workspace ที่มีชื่อผู้ใช้ตรงกับที่ถูก @mention

    for (const member of members) { // สำหรับสมาชิกแต่ละคนที่ถูก @mention
      if (member.userId === senderId) continue; // ข้ามถ้าสมาชิกคนนั้นเป็นผู้ส่งโพสต์/คอมเมนต์เอง

      notifications.push({ // เพิ่มข้อมูล notification สำหรับสมาชิกคนนั้น
        workspaceId,
        userId: member.userId,
        senderId, // ผู้ที่ทำการ @mention
        type: MentionTargetType.USER,
        postId: postId ?? undefined,
        commentId: commentId ?? undefined,
        content: `${senderName} แท็กคุณใน${contextLabel}`,
      });
    }
  }

  // 2. Resolve @Role mentions
  if (roleNames.length > 0) { // ถ้ามีการ @mention แบบระบุชื่อบทบาท
    const resolvedRoles = roleNames //แปลงชื่อ role ที่ผู้ใช้พิมพ์ ให้กลายเป็น role จริงที่ระบบใช้
      .map((name) => ROLE_ALIASES[name.toLowerCase()])
      .filter((r): r is WorkspaceRole => r !== undefined); // กรองเอาเฉพาะ role ที่สามารถแปลงได้เท่านั้น

    if (resolvedRoles.length > 0) { // ถ้ามี role ที่สามารถแปลงได้อย่างน้อยหนึ่งบทบาท
      const members = await notificationRepository.findMembersByRoles(workspaceId, resolvedRoles); // หาสมาชิกใน workspace ที่มีบทบาทตรงกับที่ถูก @mention
      const existingUserIds = new Set(notifications.map((n) => n.userId)); //เอา userId ของ notification ที่มีอยู่ก่อนแล้ว มาเก็บไว้ใน Set เพื่อป้องกันการสร้าง notification ซ้ำ

      for (const member of members) { // สำหรับสมาชิกแต่ละคนที่มีบทบาทตรงกับที่ถูก @mention
        if (member.userId === senderId) continue; // ข้ามถ้าสมาชิกคนนั้นเป็นผู้ส่งโพสต์/คอมเมนต์เอง
        if (existingUserIds.has(member.userId)) continue; // ข้ามถ้าสมาชิกคนนั้นมี notification อยู่แล้วจากการ @mention แบบระบุชื่อผู้ใช้ 

        const roleName = resolvedRoles.find((r) => r === member.role); // หา role ที่ตรงกับบทบาทของสมาชิกคนนั้น เพื่อใช้ในข้อความ notification
        if (!roleName) continue; // ข้ามถ้าไม่พบ role ที่ตรงกับสมาชิก

        notifications.push({ // เพิ่มข้อมูล notification สำหรับสมาชิกคนนั้น
          workspaceId,
          userId: member.userId,
          senderId,
          type: MentionTargetType.ROLE,
          targetRole: member.role,
          postId: postId ?? undefined,
          commentId: commentId ?? undefined,
          content: `${senderName} แท็ก @${roleName} ใน${contextLabel}`,
        });

        existingUserIds.add(member.userId); //หลังจาก push notification แล้ว ก็เพิ่ม userId นี้เข้า Set ทันที
      }
    }
  }

  // 3. Batch insert + notify
  if (notifications.length > 0) { // ถ้ามี notification ที่ต้องสร้างอย่างน้อยหนึ่งรายการ
    await notificationRepository.createMany(notifications);

    const receiverIds = [...new Set(notifications.map((n) => n.userId))];  // ดึง userId ของผู้รับ notification ทั้งหมด เเบบไม่ซ้ำกัน เพื่อใช้ในการส่ง push notification

    // ส่ง push notification ให้ผู้รับทุกคน (fire and forget)
    pushToUsers(
      receiverIds, // ส่ง push notification ให้ใครที่ถูกแท็กถึงทั้งหมด
      'มีการแท็กถึงคุณ',
      `${senderName} แท็กคุณใน${contextLabel}`,
      { type: 'mention' }, // ข้อมูลเพิ่มเติมที่ส่งไปกับ push notification 
    ).catch((err) => {
      console.error('[Notification] Failed to send mention push notification:', err);
    });

    // in-app notification ผ่าน socket สำหรับ user ที่แอปเปิดอยู่
    const io = getIO(); // ดึงตัว Socket.IO instance ออกมาใช้ 
    if (io) { // ถ้า io มีค่า 
      for (const notif of notifications) { // วนส่ง in-app notification ผ่าน socket ให้กับผู้รับแต่ละคน โดยใช้ userId ในการระบุห้องที่ต้องส่ง
        io.to(`user:${notif.userId}`).emit('new_notification', { // ส่ง event 'new_notification' พร้อมข้อมูล notification ไปยังห้องของผู้รับแต่ละคน
          id: `${Date.now()}-${notif.userId}`, // สร้าง id ชั่วคราวสำหรับ notification 
          senderName, // ชื่อผู้ส่ง
          content: notif.content, // ข้อความที่จะแสดงใน in-app notification
        });
      }
    }
  }

  return notifications; // return ข้อมูล notification ที่ถูกสร้างขึ้นไป
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
