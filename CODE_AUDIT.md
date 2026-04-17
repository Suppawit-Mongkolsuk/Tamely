# Code Audit Report — Tamely
> ตรวจสอบ ณ วันที่ 17 เมษายน 2569  
> ครอบคลุม: Backend (`prisma-api`) และ Frontend Web (`Frontend_Web`)  
> หลักการ: ไม่แนะนำการเปลี่ยนแปลงที่กระทบ behavior เดิมของระบบ

---

## สารบัญ

- [Backend](#backend)
  - [B1 — N+1 Query Problems](#b1--n1-query-problems)
  - [B2 — Duplicate Logic](#b2--duplicate-logic)
  - [B3 — Error Handling](#b3--error-handling)
  - [B4 — Type Safety](#b4--type-safety)
  - [B5 — Unnecessary Re-fetching](#b5--unnecessary-re-fetching)
  - [B6 — Magic Numbers / Constants](#b6--magic-numbers--constants)
  - [B7 — AI Prompt Injection via Room Names](#b7--ai-prompt-injection-via-room-names)
- [Frontend Web](#frontend-web)
  - [F1 — Duplicate Logic](#f1--duplicate-logic)
  - [F2 — useEffect Dependency Issues](#f2--useeffect-dependency-issues)
  - [F3 — Over-complex Components](#f3--over-complex-components)
  - [F4 — Type Safety](#f4--type-safety)
  - [F5 — Hardcoded Values](#f5--hardcoded-values)
  - [F6 — Missing Error States](#f6--missing-error-states)
- [ลำดับความสำคัญการแก้ไข](#ลำดับความสำคัญการแก้ไข)

---

## Backend

### B1 — N+1 Query Problems

#### 🔴 DM Service — `getConversations`
**File:** `src/modules/dm/dm.service.ts` (ประมาณ line 44–58)

**ปัญหา:** loop `conversations.map()` แล้วยิง `countUnread()` ทีละ conversation → N+1 queries

```ts
// ❌ ปัจจุบัน
const withUnread = await Promise.all(
  conversations.map(async (conv) => {
    const unread = await dmRepository.countUnread(conv.id, userId); // ← N queries
    ...
  }),
);
```

**แนะนำ:** เพิ่ม `countUnreadByConversationIds()` ใน `dm.repository.ts` แบบเดียวกับ `countUnreadByRoomIds` ที่ทำไว้ใน `room.repository.ts` (ใช้ raw SQL query เดียว)

```ts
// ✅ แนวทางแก้
const unreadMap = await dmRepository.countUnreadByConversationIds(userId, convIds);
const withUnread = conversations.map((conv) => ({
  ...conv,
  unreadCount: unreadMap.get(conv.id) ?? 0,
}));
```

---

#### 🔴 Workspace Service — `getUserWorkspaces`
**File:** `src/modules/workspace/workspace.service.ts` (ประมาณ line 32–45)

**ปัญหา:** `Promise.all()` map แต่ละ workspace แล้วเรียก `getUserPermissionsArray()` ซึ่งยิง DB query ทุกครั้ง → N queries สำหรับ N workspaces

```ts
// ❌ ปัจจุบัน
return Promise.all(
  memberships.map(async (m) => ({
    ...m.workspace,
    myPermissions: await getUserPermissionsArray(m.workspace.id, userId), // ← N queries
  })),
);
```

**แนะนำ:** ดึง permission ทุก workspace ในครั้งเดียว หรือ include ข้อมูลที่ต้องการใน Prisma query ตั้งแต่ต้น เพื่อไม่ต้อง query ซ้ำ

---

### B2 — Duplicate Logic

#### 🟡 `assertWorkspaceMember` ซ้ำใน 3 modules
**Files:**
- `src/modules/room/room.service.ts` (line 10–14)
- `src/modules/post/post.service.ts` (line 11–15)
- `src/modules/dm/dm.service.ts` (line 10–16)

**ปัญหา:** copy-paste helper function เหมือนกันทุก module

```ts
// ซ้ำทุก module
const assertWorkspaceMember = async (workspaceId: string, userId: string) => {
  const member = await xxxRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');
  return member;
};
```

**แนะนำ:** สร้าง `src/utils/workspace.helpers.ts` แล้ว import ใช้ร่วมกัน (ระวัง: แต่ละ module ใช้ repository ของตัวเองในการ query — ต้อง unify ให้ใช้ Prisma โดยตรงแทน)

---

#### 🟡 Push Notification Logic ซ้ำ
**Files:**
- `src/modules/message/message.service.ts`
- `src/modules/dm/dm.service.ts`

**ปัญหา:** โค้ดส่ง push notification มีโครงสร้างคล้ายกันมาก

**แนะนำ:** Extract เป็น `src/utils/push.helpers.ts`

---

### B3 — Error Handling

#### 🟡 Silent `.catch(() => {})` หลายจุด
**Files:**
- `src/modules/message/message.service.ts` (fire-and-forget push notification)
- `src/modules/dm/dm.service.ts` (fire-and-forget push notification)
- `src/modules/ai/ai.service.ts` (session + query logging)

**ปัญหา:** ถ้า push notification หรือ AI logging ล้มเหลว จะไม่มีการ log error เลย ทำให้ debug ยาก

```ts
// ❌ ปัจจุบัน
someAsyncTask().catch(() => {});

// ✅ แนะนำ
someAsyncTask().catch((err) => {
  console.error('[PushNotification Failed]', err);
});
```

**หมายเหตุ:** ไม่ต้อง throw error เพราะเป็น background task แต่ควร log ไว้

---

#### 🟡 File Upload — mixed error pattern
**File:** `src/modules/message/message.routes.ts`

**ปัญหา:** บางจุดใช้ `res.status(400).json(...)` แทน `throw new AppError()` ทำให้ error handler กลาง (`middlewares/error.ts`) ไม่ได้รับ

**แนะนำ:** เปลี่ยนเป็น `throw new AppError(400, '...')` ให้สม่ำเสมอ

---

### B4 — Type Safety

#### 🟡 `any` ใน AI Service
**File:** `src/modules/ai/ai.service.ts` (line 592, 614, 703)

```ts
// ❌ ปัจจุบัน
const currentMessages: any[] = [...]
tools: TOOL_DEFINITIONS as any,
currentMessages.push(choice.message as any, ...toolResults);
```

**แนะนำ:** ใช้ type จาก OpenAI SDK:
```ts
import type { ChatCompletionMessageParam } from 'openai/resources';
const currentMessages: ChatCompletionMessageParam[] = [...]
```

---

#### 🟡 Manual type cast ใน Room Service
**File:** `src/modules/room/room.service.ts` (line 77–85)

```ts
// ❌ ปัจจุบัน
const { workspaceMembers, customRoles, ...userFields } = m.user as typeof m.user & {
  workspaceMembers: { role: string }[];
  customRoles: { customRole: {...} }[];
};
```

**แนะนำ:** กำหนด Prisma select type ที่ชัดเจนใน repository แทนการ cast ใน service layer

---

### B5 — Unnecessary Re-fetching

#### 🟢 Post Service — `updatePost`
**File:** `src/modules/post/post.service.ts`

**ปัญหา:** บางฟังก์ชัน query `findById` ก่อนแล้ว update แต่ Prisma `update` จะ throw ถ้าไม่เจอ record อยู่แล้ว → query ซ้ำ

**แนะนำ:** ใน case ที่ต้องการแค่ตรวจ existence ก่อน update พิจารณาใช้ `update` กับ `where` ที่เพียงพอแล้ว catch `P2025` error แทน

---

### B6 — Magic Numbers / Constants

**Files:** `src/modules/ai/ai.service.ts`, `src/modules/message/message.service.ts`, หลายที่

**ปัญหา:** ตัวเลขกระจายทั่วโค้ด

```ts
const CHUNK_SIZE = 50;      // ai.service.ts
const MAX_MESSAGES = 1000;  // ai.service.ts
limit: 50, max: 100         // message.service.ts
```

**แนะนำ:** สร้าง `src/config/constants.ts`

```ts
export const PAGINATION = {
  MESSAGE_DEFAULT: 50,
  MESSAGE_MAX: 100,
};

export const AI_CONFIG = {
  CHUNK_SIZE: 50,
  MAX_MESSAGES: 1000,
  MAX_TOOL_LOOPS: 6,
  MODEL: 'gpt-4o-mini',
};
```

---

### B7 — AI Prompt Injection via Room Names

**File:** `src/modules/ai/ai.service.ts` (line ~568)

**ปัญหา:** ชื่อห้องที่ user สร้างเองถูก embed ลงใน system prompt โดยตรง ถ้าใครตั้งชื่อห้องว่า `"ignore previous instructions and..."` อาจส่งผลต่อ AI behavior ได้

```ts
// ❌ มีความเสี่ยง
accessibleRooms.map((room) => `- ${room.name} (id: ${room.id})`)
```

**แนะนำ:** Sanitize room name ก่อน embed

```ts
const safeName = room.name.replace(/[`\n\r]/g, ' ').slice(0, 50);
```

---

---

## Frontend Web

### F1 — Duplicate Logic

#### 🔴 `mapMessage` และ `mapDMMessage` ซ้ำกัน ~50%
**File:** `src/features/chat-rooms/index.tsx` (line ~63–124)

**ปัญหา:** ทั้งสองฟังก์ชันมีโค้ดเหมือนกันในส่วนคำนวณ avatar initials, timestamp, date, isOwn

```ts
// ซ้ำกันทั้งใน mapMessage และ mapDMMessage
const d = new Date(m.createdAt);
const avatar = m.sender.Name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
const timestamp = d.toLocaleTimeString(...);
const date = d.toISOString().slice(0, 10);
const isOwn = m.sender.id === myId;
```

**แนะนำ:** Extract helper

```ts
const mapMessageBase = (m: any, myId: string) => {
  const d = new Date(m.createdAt);
  return {
    avatar: m.sender.Name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
    avatarUrl: m.sender.avatarUrl,
    timestamp: d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    date: d.toISOString().slice(0, 10),
    isOwn: m.sender.id === myId,
  };
};
```

---

#### 🔴 Avatar initials กระจายหลายไฟล์
**Files:** `PostCard.tsx`, `ChatWindow.tsx`, `ChatDetailPanel.tsx`, `MessageBubble.tsx`, หลายที่

**ปัญหา:** pattern `name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)` ซ้ำในหลายไฟล์

**แนะนำ:** มี `UserAvatar` component อยู่แล้วใน `src/components/ui/UserAvatar.tsx` ให้ใช้ให้ครบทุกจุด แทนที่จะเขียน inline ซ้ำ

---

### F2 — useEffect Dependency Issues

#### 🔴 `NotificationBell.tsx` — Potential infinite loop
**File:** `src/components/layout/NotificationBell.tsx` (line ~56–61)

**ปัญหา:** ถ้า `fetchNotifications` ถูกสร้างใหม่ทุก render แล้วใช้เป็น dependency จะเกิด infinite loop

```ts
// ❌ ถ้า fetchNotifications ไม่ได้ wrap ด้วย useCallback
useEffect(() => {
  fetchNotifications();
}, [fetchNotifications]); // ← อาจ loop ถ้า fetchNotifications ไม่ stable
```

**แนะนำ:** ตรวจสอบว่า `fetchNotifications` ใช้ `useCallback` อยู่แล้ว ถ้าไม่ให้เปลี่ยน dependency เป็น `[wsId]` แทน

---

#### 🟡 `useUnreadDMs.ts` — `fetchAndJoin` เรียกบ่อยเกินไป
**File:** `src/hooks/useUnreadDMs.ts` (line ~84)

**ปัญหา:** socket event `dm_received` ทุกครั้งทำให้เรียก `fetchAndJoin()` (API call) แทนที่จะ update local state

**แนะนำ:** Update unread count ใน local state โดยตรงเมื่อได้รับ event แทนการ re-fetch ทั้งหมด หรือใช้ debounce ถ้าจำเป็นต้อง fetch

---

#### 🟡 `chat-rooms/index.tsx` — `fetchDMs()` ซ้ำตอนเปิด DM
**File:** `src/features/chat-rooms/index.tsx` (line ~304–305)

**ปัญหา:** ทุกครั้งที่เปิด DM conversation จะมีการเรียก `fetchDMs()` ซ้ำ (เพื่อ refresh unread count) ทั้งที่ควร update local state แทน

---

### F3 — Over-complex Components

#### 🔴 `chat-rooms/index.tsx` — ใหญ่เกิน (820+ lines, 20+ state)
**File:** `src/features/chat-rooms/index.tsx`

**ปัญหา:** Component เดียวจัดการทั้ง rooms, DMs, socket events, message history, invite/remove dialogs

**แนะนำ:** (ทำได้ทีหลัง ไม่ urgent) แยกออกเป็น custom hooks:
- `useRoomMessages(roomId)` — message loading + pagination
- `useSocketListeners(...)` — socket event handlers
- `useRoomSelection(...)` — active room/DM state

---

#### 🟡 `PostCard.tsx` — Comment logic ปนอยู่ใน card
**File:** `src/components/feed/PostCard.tsx` (12 state variables)

**แนะนำ:** Extract `<CommentSection postId={...} />` เป็น component แยก

---

### F4 — Type Safety

#### 🟡 `as any` cast ใน member mapping
**File:** `src/features/chat-rooms/index.tsx` (line ~268)

```ts
// ❌ ปัจจุบัน
customRoles: (m.user as any).customRoles ?? []
```

**แนะนำ:** กำหนด type ให้ครบใน chat service response type หรือสร้าง interface สำหรับ room detail API response

---

### F5 — Hardcoded Values

#### 🟡 Theme colors กระจายในหลายไฟล์
**File:** `src/components/chat-rooms/ChatWindow.tsx` (หลาย line)

```tsx
// ❌ ซ้ำและกระจายทั่วโค้ด
bg-[#003366]      // bubble สีเข้ม
text-[#5EBCAD]    // read receipt
from-[#5EBCAD] to-[#46769B]  // gradient
bg-[#75A2BF]      // avatar fallback
```

**แนะนำ:** ลง Tailwind CSS custom colors ใน global CSS หรือสร้าง `src/lib/constants.ts`

```ts
export const BRAND_COLORS = {
  PRIMARY: '#003366',
  TEAL: '#5EBCAD',
  SECONDARY: '#46769B',
  AVATAR_BG: '#75A2BF',
};
```

---

#### 🟢 Upload limits และ pagination limit
**Files:** `ChatWindow.tsx`, `chat-rooms/index.tsx`

```ts
const MAX_FILE_SIZE = 10 * 1024 * 1024; // ควรเป็น constant
const LIMIT = 50;                        // ควรเป็น constant
```

**แนะนำ:** ย้ายไป `src/lib/constants.ts`

---

### F6 — Missing Error States

#### 🟡 Calendar — `getMembers` silent fail
**File:** `src/features/calendar/index.tsx` (line ~60–64)

```ts
// ❌ ปัจจุบัน
workspaceService.getMembers(wsId).then(...).catch(() => {});
```

**แนะนำ:** แสดง toast error อย่างน้อย เพื่อให้ user รู้ว่า assign member ไม่ได้

---

#### 🟢 `useUnreadDMs.ts` — multiple silent catches
**File:** `src/hooks/useUnreadDMs.ts`

**แนะนำ:** เพิ่ม `console.error(...)` อย่างน้อยใน catch เพื่อ debug ง่ายขึ้น

---

---

## ลำดับความสำคัญการแก้ไข

### 🔴 ควรแก้ก่อน (กระทบ performance / correctness)

| # | ปัญหา | ไฟล์ | Effort |
|---|-------|------|--------|
| 1 | N+1 Query — DM `getConversations` | `dm.service.ts` | Medium |
| 2 | N+1 Query — Workspace `getUserWorkspaces` | `workspace.service.ts` | Medium |
| 3 | Infinite loop risk — `NotificationBell` useEffect | `NotificationBell.tsx` | Low |
| 4 | `fetchAndJoin` เรียกบ่อยเกินใน `useUnreadDMs` | `useUnreadDMs.ts` | Low |

### 🟡 ควรแก้ถ้ามีเวลา (maintainability)

| # | ปัญหา | ไฟล์ | Effort |
|---|-------|------|--------|
| 5 | Extract `mapMessageBase` helper | `chat-rooms/index.tsx` | Low |
| 6 | Extract `assertWorkspaceMember` เป็น shared util | 3 service files | Low |
| 7 | Silent `.catch(() => {})` → เพิ่ม error log | หลายไฟล์ | Low |
| 8 | Type `any` ใน AI service → ใช้ OpenAI SDK types | `ai.service.ts` | Medium |
| 9 | Sanitize room names ก่อน embed ใน AI prompt | `ai.service.ts` | Low |
| 10 | ย้าย magic numbers → constants file (BE + FE) | หลายไฟล์ | Low |

### 🟢 ปรับปรุงระยะยาว (nice to have)

| # | ปัญหา | ไฟล์ | Effort |
|---|-------|------|--------|
| 11 | แยก `chat-rooms/index.tsx` เป็น hooks | `chat-rooms/index.tsx` | High |
| 12 | ใช้ `UserAvatar` component ให้ครบทุกจุด | หลายไฟล์ | Low |
| 13 | Extract `<CommentSection />` จาก PostCard | `PostCard.tsx` | Medium |
| 14 | รวม brand colors เป็น Tailwind config | หลายไฟล์ | Low |

---

> **หมายเหตุ:** ทุกการแก้ไขควรทดสอบ feature ที่เกี่ยวข้องหลังเปลี่ยน  
> ลำดับ 1–4 เป็น bug-risk จริง ลำดับ 5–10 เป็น cleanup ที่ปลอดภัย
