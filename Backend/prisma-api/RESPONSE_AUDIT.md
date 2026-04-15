# Backend Response Audit — Tamely API

## วัตถุประสงค์
ตรวจสอบและลด payload ของ API response ให้ส่งเฉพาะ field ที่ frontend ใช้จริง
โดยเฉพาะ field ที่เป็น **id** ซึ่งไม่ควรแสดงหากไม่จำเป็น

## หลักการตรวจสอบ

1. ทุก repository ที่ใช้ `include` แทน `select` จะส่ง **ทุก field** ของ model มา (รวม id, timestamps ที่ไม่จำเป็น)
2. ใช้ `select` เสมอแทน `include` เพื่อควบคุม field ที่ส่งออก
3. `id` ของ relation object ส่งได้ **เฉพาะเมื่อ frontend ใช้งานจริง** เช่น ใช้ navigate, ใช้ PATCH/DELETE
4. Raw FK field (`authorId`, `senderId` ฯลฯ) ที่ซ้ำกับ relation object ให้ตัดออก

### กฎตัดสิน

| สถานการณ์ | ส่ง `id` ไหม |
|---|---|
| frontend ทำ PATCH/DELETE กับ object นั้น | ✅ ส่ง |
| frontend เปรียบเทียบ owner (`author.id === user.id`) | ✅ ส่ง |
| frontend แค่แสดงชื่อ/รูป | ❌ ไม่ส่ง |
| มี raw FK (`authorId`) อยู่แล้วในระดับบน | ❌ ไม่ส่งซ้ำใน relation |
| `workspaceId` ใน nested object | ❌ frontend รู้อยู่แล้ว |
| `updatedAt` เมื่อไม่มี edit feature | ❌ ไม่ส่ง |

---

## สถานะและ Code แก้ไขแต่ละ Repository

---

### ✅ แก้ไขแล้ว — `task.repository.ts`

ตัดออก: `workspaceId`, `assigneeId` (raw FK), `createdById` (raw FK), `createdAt`, `updatedAt`, `assignee.id`, `assignee.avatarUrl`, `createdByUser.id`

---

### ✅ แก้ไขแล้ว — `workspace.repository.ts` (findAllMembers)

ตัดออก: `id` (workspaceMember id), `workspaceId`, `user.id` (ซ้ำกับ `userId`), `user.email`

---

### 🔧 ต้องแก้ไข — `message.repository.ts`

**ไฟล์:** `src/modules/message/message.repository.ts`

**ปัญหา:** ใช้ `include` → ส่ง `roomId`, `senderId` (raw FK), `updatedAt` ที่ไม่จำเป็น

**Frontend ใช้จริง:**
- `message.id` — render key + socket emit
- `message.content` — แสดงข้อความ
- `message.type` — TEXT / FILE
- `message.createdAt` — แสดงเวลา
- `message.fileUrl`, `message.fileName`, `message.fileSize` — แสดง file attachment
- `sender.id` — เปรียบเทียบว่าเป็นข้อความของตัวเองไหม (จัดชิดซ้าย/ขวา)
- `sender.Name` — แสดงชื่อ
- `sender.avatarUrl` — แสดงรูป

**แก้ไข:**

```ts
import { prisma } from '../../index';
import { MessageType } from '@prisma/client';

/* ======================= SELECTS ======================= */

const messageSelect = {
  id: true,
  content: true,
  type: true,
  createdAt: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  sender: { select: { id: true, Name: true, avatarUrl: true } },
} as const;

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
      select: messageSelect,
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
    select: messageSelect,
  });
};

/* ======================= READ ONE ======================= */

export const findById = async (messageId: string) => {
  return prisma.message.findUnique({ where: { id: messageId } });
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
```

---

### 🔧 ต้องแก้ไข — `dm.repository.ts`

**ไฟล์:** `src/modules/dm/dm.repository.ts`

**ปัญหา:** ส่ง `workspaceId`, `userAId`/`userBId` (raw FK ซ้ำกับ `userA.id`/`userB.id`), `createdAt`, `updatedAt`, `isRead` ใน last message preview

**Frontend ใช้จริง:**
- `conversation.id` — join DM room, fetch messages
- `userA.id`, `userB.id` — ระบุคู่สนทนา, เปรียบเทียบกับ currentUser
- `userA.Name`, `userB.Name` — แสดงชื่อ
- `userA.avatarUrl`, `userB.avatarUrl` — แสดงรูป
- `messages[0].content`, `messages[0].type`, `messages[0].createdAt` — preview ล่าสุดใน sidebar
- `messages[0].sender.Name` — "นายเอ: สวัสดี"

**แก้ไข:**

```ts
import { prisma } from '../../index';
import { MessageType } from '@prisma/client';

/* ======================= SELECTS ======================= */

const dmUserSelect = { id: true, Name: true, avatarUrl: true } as const;

const conversationSelect = {
  id: true,
  userA: { select: dmUserSelect },
  userB: { select: dmUserSelect },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: {
      content: true,
      type: true,
      createdAt: true,
      sender: { select: { Name: true } },
    },
  },
} as const;

const dmMessageSelect = {
  id: true,
  content: true,
  type: true,
  createdAt: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  sender: { select: dmUserSelect },
} as const;

/* ======================= CONVERSATION ======================= */

export const findOrCreateConversation = async (
  workspaceId: string,
  userId1: string,
  userId2: string,
) => {
  const [userAId, userBId] = [userId1, userId2].sort();

  const existing = await prisma.directConversation.findUnique({
    where: { workspaceId_userAId_userBId: { workspaceId, userAId, userBId } },
    select: conversationSelect,
  });

  if (existing) return existing;

  return prisma.directConversation.create({
    data: { workspaceId, userAId, userBId },
    select: {
      id: true,
      userA: { select: dmUserSelect },
      userB: { select: dmUserSelect },
      messages: false,
    },
  });
};

export const findConversationById = async (conversationId: string) => {
  return prisma.directConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      userA: { select: dmUserSelect },
      userB: { select: dmUserSelect },
    },
  });
};

export const findConversationsByUser = async (workspaceId: string, userId: string) => {
  return prisma.directConversation.findMany({
    where: {
      workspaceId,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    select: conversationSelect,
    orderBy: { updatedAt: 'desc' },
  });
};

/* ======================= MESSAGES ======================= */

export const findMessages = async (
  conversationId: string,
  options: { limit: number; offset: number; before?: string },
) => {
  const where: Record<string, unknown> = { conversationId };
  if (options.before) {
    where.createdAt = { lt: new Date(options.before) };
  }

  const [messages, total] = await Promise.all([
    prisma.directMessage.findMany({
      where,
      select: dmMessageSelect,
      orderBy: { createdAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    }),
    prisma.directMessage.count({ where }),
  ]);

  return { messages: messages.reverse(), total };
};

export const createMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  type: MessageType = MessageType.TEXT,
  fileData?: { fileUrl: string; fileName: string; fileSize: number },
) => {
  const [message] = await prisma.$transaction([
    prisma.directMessage.create({
      data: {
        conversationId,
        senderId,
        content,
        type,
        fileUrl: fileData?.fileUrl ?? null,
        fileName: fileData?.fileName ?? null,
        fileSize: fileData?.fileSize ?? null,
      },
      select: dmMessageSelect,
    }),
    prisma.directConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
  return message;
};

export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  return prisma.directMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });
};

export const countUnread = async (conversationId: string, userId: string) => {
  return prisma.directMessage.count({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
  });
};

export const deleteMessage = async (messageId: string) => {
  return prisma.directMessage.delete({ where: { id: messageId } });
};

export const findMessageById = async (messageId: string) => {
  return prisma.directMessage.findUnique({ where: { id: messageId } });
};
```

---

### 🔧 ต้องแก้ไข — `room.repository.ts`

**ไฟล์:** `src/modules/room/room.repository.ts`

**ปัญหา:** `memberUserSelect` มี `email`, `workspaceMembers` nested ส่ง `workspaceId` ซ้ำซ้อน

**Frontend ใช้จริง:**
- `room.id` — join room, fetch messages
- `room.name`, `room.description`, `room.isPrivate` — แสดงข้อมูล
- `room.createdBy.id` — เช็ค owner (แสดงปุ่ม manage)
- `room.createdBy.Name`, `room.createdBy.avatarUrl` — แสดงผู้สร้าง
- `room.members[].user.id` — ระบุตัว member
- `room.members[].user.Name`, `avatarUrl` — แสดงใน member list
- `room.members[].user.workspaceRole` — แสดง badge role (custom field จาก workspaceMembers)
- `room._count.members` — แสดงจำนวนสมาชิก

**แก้ไข: เปลี่ยน `memberUserSelect` และ `findById`**

```ts
// บรรทัด 8 — ตัด email ออก
const memberUserSelect = { id: true, Name: true, avatarUrl: true } as const;

// ใน findById — workspaceMembers select ตัด workspaceId ออก
export const findById = async (roomId: string) => {
  return prisma.room.findUnique({
    where: { id: roomId },
    include: {
      _count: { select: { members: true } },
      createdBy: { select: creatorSelect },
      members: {
        include: {
          user: {
            select: {
              ...memberUserSelect,
              workspaceMembers: {
                select: { role: true }, // ตัด workspaceId ออก
              },
            },
          },
        },
      },
    },
  });
};

// createRoomMember — ตัด email ออก (ใช้ memberUserSelect ที่อัปเดตแล้ว)
export const createRoomMember = async (roomId: string, userId: string) => {
  return prisma.roomMember.create({
    data: { roomId, userId },
    include: {
      user: { select: memberUserSelect },
    },
  });
};
```

---

### 🔧 ต้องแก้ไข — `post.repository.ts`

**ไฟล์:** `src/modules/post/post.repository.ts`

**ปัญหา:** ใช้ `include` → ส่ง `workspaceId`, `authorId` (raw FK ซ้ำกับ `author.id`), `updatedAt`

**Frontend ใช้จริง:**
- `post.id` — comment, pin, edit, delete
- `post.title`, `post.body`, `post.imageUrls` — แสดงเนื้อหา
- `post.isPinned` — แสดง pin badge
- `post.createdAt` — แสดงเวลา
- `post.author.id` — เช็ค `author.id === currentUser.id` เพื่อแสดงปุ่ม edit/delete
- `post.author.Name`, `post.author.avatarUrl` — แสดงผู้โพสต์
- `post._count.comments` — แสดงจำนวน comment
- `comment.id` — delete comment
- `comment.content` — แสดง comment
- `comment.createdAt` — แสดงเวลา comment
- `comment.user.id` — เช็ค owner comment
- `comment.user.Name`, `comment.user.avatarUrl` — แสดงผู้ comment

**แก้ไข:**

```ts
import { prisma } from '../../index';
import { TypePayloadCreatePost, TypePayloadUpdatePost } from './post.model';

/* ======================= SELECTS ======================= */

const authorSelect = { id: true, Name: true, avatarUrl: true } as const;

const postSelect = {
  id: true,
  title: true,
  body: true,
  imageUrls: true,
  isPinned: true,
  createdAt: true,
  author: { select: authorSelect },
  _count: { select: { comments: true } },
} as const;

/* ======================= WORKSPACE MEMBER ======================= */

export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
};

export const findWorkspaceMemberWithUser = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: { user: { select: { id: true, Name: true } } },
  });
};

/* ======================= CREATE ======================= */

export const create = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadCreatePost,
) => {
  return prisma.post.create({
    data: {
      workspaceId,
      authorId: userId,
      title: data.title,
      body: data.body,
      imageUrls: data.imageUrls ?? [],
    },
    select: postSelect,
  });
};

/* ======================= READ ======================= */

export const findMany = async (
  workspaceId: string,
  options: { limit: number; offset: number },
) => {
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { workspaceId },
      select: postSelect,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: options.limit,
      skip: options.offset,
    }),
    prisma.post.count({ where: { workspaceId } }),
  ]);

  return { posts, total };
};

export const findById = async (postId: string) => {
  return prisma.post.findUnique({ where: { id: postId } });
};

/* ======================= UPDATE ======================= */

export const update = async (postId: string, data: TypePayloadUpdatePost) => {
  return prisma.post.update({
    where: { id: postId },
    data,
    select: postSelect,
  });
};

export const updatePin = async (postId: string, isPinned: boolean) => {
  return prisma.post.update({
    where: { id: postId },
    data: { isPinned },
  });
};

/* ======================= DELETE ======================= */

export const remove = async (postId: string) => {
  return prisma.post.delete({ where: { id: postId } });
};

/* ======================= COMMENTS ======================= */

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  user: { select: authorSelect },
} as const;

export const findComments = async (
  postId: string,
  options: { limit: number; offset: number },
) => {
  const [comments, total] = await Promise.all([
    prisma.postComment.findMany({
      where: { postId },
      select: commentSelect,
      orderBy: { createdAt: 'asc' },
      take: options.limit,
      skip: options.offset,
    }),
    prisma.postComment.count({ where: { postId } }),
  ]);

  return { comments, total };
};

export const createComment = async (
  postId: string,
  userId: string,
  content: string,
) => {
  return prisma.postComment.create({
    data: { postId, userId, content },
    select: commentSelect,
  });
};

export const findCommentById = async (commentId: string) => {
  return prisma.postComment.findUnique({
    where: { id: commentId },
    include: { post: true },
  });
};

export const removeComment = async (commentId: string) => {
  return prisma.postComment.delete({ where: { id: commentId } });
};
```

---

### 🔧 ต้องแก้ไข — `notification.repository.ts`

**ไฟล์:** `src/modules/notification/notification.repository.ts`

**ปัญหา:** ส่ง `userId`, `workspaceId`, `senderId` (raw FK), `targetRole`, `postId`/`commentId` (raw FK), `post.body` (ยาวเกินไป)

**Frontend ใช้จริง:**
- `notification.id` — mark as read: PATCH /notifications/:id
- `notification.type` — USER / ROLE (แสดง icon ต่างกัน)
- `notification.content` — เนื้อหาแจ้งเตือน
- `notification.isRead` — แสดงจุดแดง unread
- `notification.createdAt` — แสดงเวลา
- `notification.sender.id` — navigate ไปหน้า profile (ถ้ามี)
- `notification.sender.Name`, `sender.avatarUrl` — แสดงผู้ส่ง
- `notification.post.id` — navigate ไปโพสต์ที่ถูก mention
- `notification.post.title` — แสดง preview ชื่อโพสต์
- `notification.comment.id` — navigate ไป comment
- `notification.comment.content` — แสดง preview comment

**แก้ไข:**

```ts
import { prisma } from '../../index';
import { MentionTargetType, WorkspaceRole } from '@prisma/client';

/* ======================= SELECTS ======================= */

const senderSelect = { id: true, Name: true, avatarUrl: true } as const;

const notificationSelect = {
  id: true,
  type: true,
  content: true,
  isRead: true,
  createdAt: true,
  sender: { select: senderSelect },
  post: { select: { id: true, title: true } },       // ตัด body ออก
  comment: { select: { id: true, content: true } },
} as const;

/* ======================= CREATE ======================= */

export const createMany = async (
  notifications: {
    workspaceId: string;
    userId: string;
    senderId: string;
    type: MentionTargetType;
    targetRole?: WorkspaceRole;
    postId?: string;
    commentId?: string;
    content: string;
  }[],
) => {
  if (notifications.length === 0) return;

  return prisma.notification.createMany({
    data: notifications,
    skipDuplicates: true,
  });
};

/* ======================= READ ======================= */

export const findMany = async (
  userId: string,
  workspaceId: string,
  options: { limit: number; offset: number; unreadOnly: boolean },
) => {
  const where = {
    userId,
    workspaceId,
    ...(options.unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      select: notificationSelect,
      orderBy: { createdAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, workspaceId, isRead: false },
    }),
  ]);

  return { notifications, total, unreadCount };
};

export const findById = async (id: string) => {
  return prisma.notification.findUnique({ where: { id } });
};

/* ======================= UPDATE ======================= */

export const markRead = async (id: string) => {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

export const markAllRead = async (userId: string, workspaceId: string) => {
  return prisma.notification.updateMany({
    where: { userId, workspaceId, isRead: false },
    data: { isRead: true },
  });
};

/* ======================= HELPERS ======================= */

export const findMembersByNames = async (
  workspaceId: string,
  names: string[],
) => {
  if (names.length === 0) return [];

  return prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      user: { Name: { in: names, mode: 'insensitive' } },
    },
    include: { user: { select: { id: true, Name: true } } },
  });
};

export const findMembersByRoles = async (
  workspaceId: string,
  roles: WorkspaceRole[],
) => {
  if (roles.length === 0) return [];

  return prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      role: { in: roles },
    },
    include: { user: { select: { id: true, Name: true } } },
  });
};
```

---

## Checklist

- [x] `task.repository.ts` — แก้ไขแล้ว
- [x] `workspace.repository.ts` (findAllMembers) — แก้ไขแล้ว
- [ ] `message.repository.ts` — ใช้ code จาก section ด้านบน
- [ ] `dm.repository.ts` — ใช้ code จาก section ด้านบน
- [ ] `room.repository.ts` — แก้ `memberUserSelect` ตัด `email` + `workspaceMembers select` ตัด `workspaceId`
- [ ] `post.repository.ts` — ใช้ code จาก section ด้านบน
- [ ] `notification.repository.ts` — ใช้ code จาก section ด้านบน

## หมายเหตุสำหรับ AI ที่นำไปแก้ไข

1. **อย่าแก้ไข** `findById` / `findByIdSimple` functions ที่ใช้ใน middleware/service สำหรับ authorization check — functions เหล่านี้ต้องการ raw data ครบ
2. **ตรวจสอบ TypeScript error** หลังแก้ไข เพราะ service layer อาจมี type ที่ depend กับ shape เดิม
3. **ทดสอบ** ทุก feature ที่เกี่ยวข้องหลังแก้ไขแต่ละ repository
4. `findMembersByNames` และ `findMembersByRoles` ใน notification — ยังใช้ `include` อยู่เพราะใช้ภายใน service เท่านั้น ไม่ได้ส่งออก API โดยตรง
