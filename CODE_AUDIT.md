# Code Audit Report — Tamely
> ตรวจสอบ ณ วันที่ 17 เมษายน 2569 (ฉบับสมบูรณ์)
> ครอบคลุม: Backend (`prisma-api`) และ Frontend Web (`Frontend_Web`)
> หลักการ: ไม่แนะนำการเปลี่ยนแปลงที่กระทบ behavior เดิมของระบบ

---

## สารบัญ

- [Backend](#backend)
  - [B1 — Bugs / Correctness](#b1--bugs--correctness)
  - [B2 — N+1 Query Problems](#b2--n1-query-problems)
  - [B3 — Duplicate Logic / Dead Code](#b3--duplicate-logic--dead-code)
  - [B4 — Error Handling](#b4--error-handling)
  - [B5 — Type Safety](#b5--type-safety)
  - [B6 — Unnecessary Re-fetching](#b6--unnecessary-re-fetching)
  - [B7 — Magic Numbers / Constants](#b7--magic-numbers--constants)
  - [B8 — AI Prompt Injection via Room Names](#b8--ai-prompt-injection-via-room-names)
- [Frontend Web](#frontend-web)
  - [F1 — Bugs / Correctness](#f1--bugs--correctness)
  - [F2 — Duplicate Logic / Dead Code](#f2--duplicate-logic--dead-code)
  - [F3 — useEffect / Memory Issues](#f3--useeffect--memory-issues)
  - [F4 — Type Safety & Inconsistency](#f4--type-safety--inconsistency)
  - [F5 — Over-complex Components](#f5--over-complex-components)
  - [F6 — Hardcoded Values](#f6--hardcoded-values)
  - [F7 — Missing Error States](#f7--missing-error-states)
- [ลำดับความสำคัญการแก้ไข](#ลำดับความสำคัญการแก้ไข)

---

## Backend

### B1 — Bugs / Correctness

#### 🔴 Notification — `roleName` อาจเป็น `undefined`
**File:** `src/modules/notification/notification.service.ts` (line ~115)

**ปัญหา:** `find()` อาจ return `undefined` แต่ถูกใช้โดยตรงใน string template

```ts
// ❌ ปัจจุบัน
const roleName = resolvedRoles.find((r) => r === member.role);
notifications.push({
  content: `${senderName} แท็ก @${roleName} ใน${contextLabel}`, // ← "@undefined" ถ้า find ไม่เจอ
});
```

**แนะนำ:** เพิ่ม guard

```ts
const roleName = resolvedRoles.find((r) => r === member.role);
if (!roleName) continue; // skip ถ้าไม่พบ role
```

---

### B2 — N+1 Query Problems

#### 🔴 DM Service — `getConversations`
**File:** `src/modules/dm/dm.service.ts` (line ~44–58)

**ปัญหา:** loop `conversations.map()` แล้วยิง `countUnread()` ทีละ conversation → N+1 queries

```ts
// ❌ ปัจจุบัน
const withUnread = await Promise.all(
  conversations.map(async (conv) => {
    const unread = await dmRepository.countUnread(conv.id, userId); // ← N queries
  }),
);
```

**แนะนำ:** เพิ่ม `countUnreadByConversationIds()` ใน `dm.repository.ts` แบบเดียวกับ `countUnreadByRoomIds` ใน `room.repository.ts` (raw SQL query เดียว)

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
**File:** `src/modules/workspace/workspace.service.ts` (line ~32–45)

**ปัญหา:** `Promise.all()` map แต่ละ workspace แล้วเรียก `getUserPermissionsArray()` → N queries

```ts
// ❌ ปัจจุบัน
return Promise.all(
  memberships.map(async (m) => ({
    myPermissions: await getUserPermissionsArray(m.workspace.id, userId), // ← N queries
  })),
);
```

**แนะนำ:** Include permissions ใน Prisma query ตั้งแต่ต้น หรือ batch resolve ทุก workspace ในครั้งเดียว

---

### B3 — Duplicate Logic / Dead Code

#### 🟡 `param` helper ซ้ำใน 3 routes files
**Files:**
- `src/modules/custom-role/custom-role.routes.ts` (line 20–21)
- `src/modules/message/message.routes.ts` (line 16–17)
- `src/modules/notification/notification.routes.ts` (line 11–12)

**ปัญหา:** ฟังก์ชัน `param()` เหมือนกัน 100% ใน 3 ไฟล์

```ts
// ซ้ำทั้ง 3 ไฟล์
const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');
```

**แนะนำ:** สร้าง `src/utils/route.utils.ts` แล้ว import ร่วมกัน

---

#### 🟡 `assertWorkspaceMember` ซ้ำใน 3 modules
**Files:** `room.service.ts` (10–14), `post.service.ts` (11–15), `dm.service.ts` (10–16)

**ปัญหา:** copy-paste helper เหมือนกันทุก module

**แนะนำ:** Extract เป็น shared utility ใน `src/utils/workspace.helpers.ts` โดยใช้ Prisma โดยตรง

---

#### 🟡 `findWorkspaceMember` ใน `message.repository.ts` — ไม่ถูกใช้
**File:** `src/modules/message/message.repository.ts` (line ~97)

**ปัญหา:** function ถูก export แต่ไม่มี import ใน `message.service.ts` หรือที่อื่น

```ts
// ❌ Dead code
export const findWorkspaceMember = async (workspaceId: string, userId: string) => { ... };
```

**แนะนำ:** ลบออก หรือตรวจสอบว่าต้องการใช้จริงหรือไม่

---

#### 🟡 `reorderCustomRoles` เรียก `findMany` ซ้ำ
**File:** `src/modules/custom-role/custom-role.service.ts` (line ~80, 88)

**ปัญหา:** ดึง roles จาก DB (line 80) แล้วดึงซ้ำอีกครั้งท้ายฟังก์ชัน (line 88) ทั้งที่ใช้ข้อมูลชุดเดิม

**แนะนำ:** Reuse ตัวแปร `roles` จาก line 80 หรือ return ผลลัพธ์จากการ update batch แทน

---

#### 🟡 `_workspaceId` ไม่ได้ใช้ใน repository แต่ไม่ validate
**File:** `src/modules/custom-role/custom-role.repository.ts` (line 68, 79)

**ปัญหา:** `update` และ `remove` รับ `_workspaceId` แต่ไม่ได้ใช้ใน query — ทำให้ไม่ได้ verify ว่า role นั้นเป็นของ workspace จริง (ป้องกันไว้ที่ service layer แต่ repository ไม่มี safety net)

**แนะนำ:** เพิ่ม workspaceId ใน where clause เพื่อ double-check

```ts
where: { id: roleId, workspaceId } // ← เพิ่ม workspaceId
```

---

### B4 — Error Handling

#### 🟡 Silent `.catch(() => {})` หลายจุด — ไม่มี log เลย
**Files:**

| File | บริบท |
|------|-------|
| `message.service.ts` | fire-and-forget push notification |
| `dm.service.ts` | fire-and-forget push notification |
| `ai/ai.service.ts` | session + query logging |
| `chat/chat.gateway.ts` (line ~113) | `safeUpdateCallLog` |
| `notification/notification.service.ts` (line ~144) | push notification |
| `index.ts` (line ~149–150) | `ensureBucket` ทั้ง 2 bucket |
| `index.ts` (line ~104–106) | Twilio TURN credentials |

**แนะนำ:** ไม่ต้อง throw แต่ควร log ทุกจุด

```ts
// ✅
.catch((err) => {
  console.error('[PushNotification] Failed:', err);
});
```

---

#### 🟡 File Upload — mixed error pattern
**File:** `src/modules/message/message.routes.ts`

**ปัญหา:** บางจุดใช้ `res.status(400).json(...)` แทน `throw new AppError()` ทำให้ error handler กลางไม่ได้รับ

**แนะนำ:** เปลี่ยนเป็น `throw new AppError(400, '...')` ทุกจุด

---

#### 🟡 Notification Routes — `param()` ไม่ validate ว่าว่างเปล่า
**File:** `src/modules/notification/notification.routes.ts` (line ~11–12)

**ปัญหา:** ถ้า param ไม่มีค่า จะ return `""` (empty string) แทนที่จะ throw error → อาจทำให้ query ด้วย empty string ID

```ts
// ❌ return "" ถ้าไม่มีค่า
const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');
```

**แนะนำ:**
```ts
const requireParam = (value: string | string[] | undefined, name: string): string => {
  const str = Array.isArray(value) ? value[0] : value;
  if (!str) throw new AppError(400, `Missing parameter: ${name}`);
  return str;
};
```

---

### B5 — Type Safety

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

#### 🟡 `any` callback type ใน chat.gateway.ts
**File:** `src/modules/chat/chat.gateway.ts` (line ~239, 279, 311)

```ts
// ❌ ปัจจุบัน
callback?: (res: any) => void
```

**แนะนำ:** ระบุ type เฉพาะ
```ts
callback?: (res: { success: boolean; error?: string }) => void
```

---

#### 🟡 Manual type cast ใน Room Service
**File:** `src/modules/room/room.service.ts` (line 77–85)

**ปัญหา:** cast ด้วย `as typeof m.user & {...}` อาจไม่ตรงกับ Prisma select จริง

**แนะนำ:** กำหนด Prisma select type ที่ชัดเจนใน repository แทน

---

#### 🟡 Type assertion ไม่ safe ใน index.ts
**File:** `src/index.ts` (line ~97)

```ts
// ❌ ปัจจุบัน
const data = await response.json() as { ice_servers?: {...}[] };
```

**แนะนำ:** ใช้ Zod หรือ type guard แทน assertion ตรงๆ

---

### B6 — Unnecessary Re-fetching

#### 🟢 Post Service — `updatePost` query ซ้ำ
**File:** `src/modules/post/post.service.ts`

**ปัญหา:** บาง function ทำ `findById` ก่อน update แต่ Prisma `update` จะ throw `P2025` เองถ้าไม่เจอ record

**แนะนำ:** ใน case ที่ไม่ต้องการข้อมูล record ก่อน update ให้ใช้ `update` โดยตรงแล้ว catch `P2025`

---

### B7 — Magic Numbers / Constants

**Files:** `ai.service.ts`, `message.service.ts`, หลายที่

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

### B8 — AI Prompt Injection via Room Names

**File:** `src/modules/ai/ai.service.ts` (line ~568)

**ปัญหา:** ชื่อห้องที่ user สร้างเองถูก embed ลงใน system prompt โดยตรง

```ts
// ❌ มีความเสี่ยง
accessibleRooms.map((room) => `- ${room.name} (id: ${room.id})`)
```

**แนะนำ:** Sanitize ก่อน embed

```ts
const safeName = room.name.replace(/[`\n\r]/g, ' ').slice(0, 50);
```

---

---

## Frontend Web

### F1 — Bugs / Correctness

#### 🔴 AI Chat — `useState` ได้รับ function reference แทนค่า
**File:** `src/features/ai-chat/index.tsx` (line ~59)

**ปัญหา:** `useState(generateSessionId)` ส่งฟังก์ชันเป็น lazy initializer ซึ่ง React จะ **เรียกให้เอง** — ดูเหมือนถูกต้องแต่ต้องตรวจสอบว่า `generateSessionId` คืออะไรกันแน่

```ts
const [sessionId, setSessionId] = useState<string>(generateSessionId);
```

- ถ้า `generateSessionId` เป็น `() => crypto.randomUUID()` → ✅ ถูกต้อง (React เรียก lazy init)
- ถ้า `generateSessionId` เป็น string ธรรมดา → ❌ ต้องเปลี่ยนเป็น `useState(generateSessionId())`

**แนะนำ:** ตรวจสอบ type ของ `generateSessionId` และเพิ่ม comment อธิบาย

---

#### 🔴 AI Chat — `loadSessions` ขาดใน useEffect dependency
**File:** `src/features/ai-chat/index.tsx` (line ~99)

**ปัญหา:** เรียก `loadSessions()` ใน useEffect แต่ไม่ใส่ใน dependency array → stale closure

```ts
// ❌ ปัจจุบัน
useEffect(() => {
  loadSessions(currentWorkspace.id);
}, [currentWorkspace?.id]); // ← loadSessions หายไป
```

**แนะนำ:**
```ts
}, [currentWorkspace?.id, loadSessions]);
```

---

#### 🔴 Settings — Memory Leak จาก `URL.createObjectURL`
**File:** `src/features/settings/ProfileTab.tsx` (line ~61)

**ปัญหา:** สร้าง Object URL ทุกครั้งที่ user เลือกรูป แต่ไม่เคย `revokeObjectURL` → memory leak

```ts
// ❌ ปัจจุบัน
setAvatarPreview(URL.createObjectURL(file)); // ไม่มี revoke
```

**แนะนำ:**
```ts
const handleAvatarChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  // Revoke ก่อน
  if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
  setAvatarPreview(URL.createObjectURL(file));
};
```

---

### F2 — Duplicate Logic / Dead Code

#### 🔴 `mapMessage` และ `mapDMMessage` ซ้ำกัน ~99%
**File:** `src/features/chat-rooms/index.tsx` (line ~63–124)

**ปัญหา:** ต่างกันแค่ field `isRead` แต่เขียนซ้ำทั้งฟังก์ชัน

**แนะนำ:** Merge เป็นฟังก์ชันเดียว

```ts
function mapMessage(m: MessageResponse | DMMessageResponse, myId: string): Message {
  const d = new Date(m.createdAt);
  return {
    ...
    isRead: 'isRead' in m ? m.isRead : undefined,
  };
}
```

---

#### 🔴 `getInitials()` และ `formatTime()` มีอยู่ใน `lib/utils.ts` แต่ไม่ถูกใช้
**File:** `src/lib/utils.ts` (line ~22, ~35)

**ปัญหา:** helper ทั้งสองมีอยู่แล้ว แต่ไฟล์อื่น (โดยเฉพาะ `chat-rooms/index.tsx`) เขียน logic ซ้ำแทนที่จะ import

```ts
// chat-rooms/index.tsx — เขียนซ้ำ 3 ครั้ง
m.sender.Name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

// ควรใช้จาก utils
import { getInitials, formatTime } from '@/lib/utils';
```

---

#### 🔴 Avatar initials กระจายหลายไฟล์
**Files:** `PostCard.tsx`, `ChatWindow.tsx`, `ChatDetailPanel.tsx`, `MessageBubble.tsx`, หลายที่

**ปัญหา:** `name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)` ซ้ำหลายไฟล์ ทั้งที่มี `UserAvatar` component และ `getInitials()` util อยู่แล้ว

**แนะนำ:** ใช้ `<UserAvatar>` และ `getInitials()` ให้ครบทุกจุด

---

#### 🟡 `formatRoomPreviewTime` ซ้ำกับ `formatTime` ใน utils
**File:** `src/features/chat-rooms/index.tsx` (line ~34–38)

**ปัญหา:** สร้าง formatter ใหม่ทั้งที่ `formatTime()` ใน `lib/utils.ts` ทำสิ่งเดียวกัน

**แนะนำ:** ลบ `formatRoomPreviewTime` แล้วใช้ `formatTime` จาก utils แทน

---

#### 🟡 `leaveWorkspace` และ `removeMember` ทำสิ่งเดียวกัน
**File:** `src/services/workspace.service.ts` (line ~44, ~67)

**ปัญหา:** ทั้งสองเรียก endpoint เดียวกัน `DELETE /workspaces/:id/members/:userId`

```ts
// ทำสิ่งเดียวกัน
async removeMember(workspaceId, userId) { ... }
async leaveWorkspace(workspaceId, userId) { ... }
```

**แนะนำ:** เก็บไว้ทั้งคู่แต่ให้ `leaveWorkspace` เรียก `removeMember` แทน (เพื่อ clarity ว่าใครใช้ในบริบทใด)

---

#### 🟡 `inviteMember` ใน workspace.service.ts — ตรวจสอบว่าใช้จริงไหม
**File:** `src/services/workspace.service.ts` (line ~40)

**แนะนำ:** Search codebase ว่ามีใคร call `workspaceService.inviteMember()` หรือไม่ ถ้าไม่มีให้ลบออก

---

#### 🟡 `AuthResponse` ใน types/user.ts — ไม่มีใครใช้
**File:** `src/types/user.ts` (line ~46)

```ts
// ไม่ถูกใช้
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

**แนะนำ:** ลบออก หรือ mark เป็น `@deprecated`

---

#### 🟡 `dmService` ไม่ได้ export จาก `services/index.ts`
**File:** `src/services/index.ts`

**ปัญหา:** ทุก service อื่น export ผ่าน index แต่ `dmService` ไม่มี ทำให้ต้อง import โดยตรง

```ts
// ❌ ต้อง import โดยตรง
import { dmService } from '@/services/dm.service';

// ✅ ควร import ผ่าน barrel
import { dmService } from '@/services';
```

**แนะนำ:** เพิ่ม `export { dmService } from './dm.service';` ใน `index.ts`

---

### F3 — useEffect / Memory Issues

#### 🔴 `useUnreadDMs` — `roomNameMap` ใน dependency ทำให้ re-register listener ไม่จำเป็น
**File:** `src/hooks/useUnreadDMs.ts` (line ~110–133)

**ปัญหา:** `roomNameMap` ถูกสร้างใหม่ทุกครั้งที่ `fetchAndJoin()` รัน ถ้าใส่ใน dependency array จะทำให้ effect re-run ซ้ำๆ

**แนะนำ:** ถ้า `roomNameMap` ใช้แค่ lookup ใน handler ไม่จำเป็นต้องใส่ใน deps
```ts
}, [fetchAndJoin, myId, isOnChatPage]); // ไม่ต้องมี roomNameMap
```

---

#### 🔴 `NotificationBell.tsx` — Potential infinite loop
**File:** `src/components/layout/NotificationBell.tsx` (line ~56–61)

**ปัญหา:** ถ้า `fetchNotifications` ไม่ได้ wrap ด้วย `useCallback` จะถูกสร้างใหม่ทุก render → loop

**แนะนำ:** ตรวจสอบว่า `fetchNotifications` ใช้ `useCallback` อยู่แล้ว ถ้าไม่ให้เปลี่ยน dependency เป็น `[wsId]`

---

#### 🟡 Settings — Cancel button สร้าง inline function ทุก render
**File:** `src/features/settings/ProfileTab.tsx` (line ~198–203)

```ts
// ❌ ปัจจุบัน — สร้าง function ใหม่ทุก render
<Button onClick={() => {
  setDisplayName(user?.displayName ?? '');
  ...
}}>
```

**แนะนำ:** Extract เป็น `useCallback`

---

#### 🟡 `useUnreadDMs` — `fetchAndJoin` เรียก API ทุก socket event
**File:** `src/hooks/useUnreadDMs.ts` (line ~84)

**ปัญหา:** ทุกครั้งที่ได้รับ `dm_received` จะ re-fetch ทั้งหมดจาก API

**แนะนำ:** Update local state โดยตรงเมื่อได้รับ event แทน

---

#### 🟡 `chat-rooms/index.tsx` — `fetchDMs()` ซ้ำตอนเปิด DM
**File:** `src/features/chat-rooms/index.tsx` (line ~304–305)

**ปัญหา:** เปิด DM ทุกครั้งเรียก `fetchDMs()` ซ้ำเพื่อ refresh unread count ทั้งที่ควร update local state

---

### F4 — Type Safety & Inconsistency

#### 🟡 `Name` vs `displayName` ไม่ consistent
**Files:** `types/user.ts` (displayName), `types/workspace.ts` (Name), `services/dm.service.ts` (Name), `services/chat.service.ts` (Name)

**ปัญหา:** `User` interface ใช้ `displayName` แต่ workspace/DM types ใช้ `Name` (capital N ตาม Prisma schema) ทำให้โค้ดอ่านยากและสับสน

**แนะนำ:** ไม่ต้องแก้ schema แต่ควรเพิ่ม comment อธิบายว่า `Name` มาจาก Prisma model field ตรงๆ และ `displayName` เป็น app-level naming

---

#### 🟡 `as any` cast ใน member mapping
**File:** `src/features/chat-rooms/index.tsx` (line ~268)

```ts
// ❌ ปัจจุบัน
customRoles: (m.user as any).customRoles ?? []
```

**แนะนำ:** กำหนด type ให้ครบใน chat service response type

---

### F5 — Over-complex Components

#### 🟡 `chat-rooms/index.tsx` — ใหญ่เกิน (820+ lines, 20+ state)

**ปัญหา:** Component เดียวจัดการทั้ง rooms, DMs, socket events, message history, dialogs

**แนะนำ:** (ทำได้ทีหลัง) แยกออกเป็น custom hooks:
- `useRoomMessages(roomId)` — message loading + pagination
- `useSocketListeners(...)` — socket event handlers
- `useRoomSelection(...)` — active room/DM state

---

#### 🟢 `PostCard.tsx` — Comment logic ปนอยู่ใน card
**File:** `src/components/feed/PostCard.tsx` (12 state variables)

**แนะนำ:** Extract `<CommentSection postId={...} />` เป็น component แยก

---

### F6 — Hardcoded Values

#### 🟡 Theme colors กระจายในหลายไฟล์
**File:** `src/components/chat-rooms/ChatWindow.tsx` และไฟล์อื่น

```tsx
bg-[#003366]              // bubble สีเข้ม
text-[#5EBCAD]            // read receipt
from-[#5EBCAD] to-[#46769B]  // gradient
bg-[#75A2BF]              // avatar fallback
```

**แนะนำ:** สร้าง `src/lib/constants.ts`

```ts
export const BRAND_COLORS = {
  PRIMARY: '#003366',
  TEAL: '#5EBCAD',
  SECONDARY: '#46769B',
  AVATAR_BG: '#75A2BF',
};
```

---

#### 🟢 Magic numbers ใน FE
**Files:** `ChatWindow.tsx`, `chat-rooms/index.tsx`, `NotificationBell.tsx`

```ts
const MAX_FILE_SIZE = 10 * 1024 * 1024;  // ควรเป็น constant
const LIMIT = 50;
30_000  // polling interval
60_000  // polling interval
2500    // highlight clear timeout
```

**แนะนำ:** ย้ายทั้งหมดไป `src/lib/constants.ts`

---

### F7 — Missing Error States

#### 🟡 Silent fail หลายจุด — ทำให้ debug ยาก

| File | บริบท |
|------|-------|
| `features/chat-rooms/index.tsx` (~270, 294) | `fetchRoomDetail`, `fetchWorkspaceMembers` |
| `features/calendar/index.tsx` (~64) | `getMembers` |
| `hooks/useUnreadDMs.ts` (~58) | `fetchAndJoin` |
| `hooks/useLocalStorage.ts` (~10) | `JSON.parse` |
| `features/ai-chat/index.tsx` (~76) | `loadSessions` |

**แนะนำ:** ไม่จำเป็นต้อง show toast ทุกที่ แต่ควร `console.warn(...)` อย่างน้อย เพื่อ debug ง่ายขึ้น

---

---

## ลำดับความสำคัญการแก้ไข

### 🔴 ควรแก้ก่อน — Bug / Correctness / Performance

| # | ปัญหา | ไฟล์ | Effort |
|---|-------|------|--------|
| 1 | Undefined `roleName` → "@undefined" ใน notification | `notification.service.ts:115` | Low |
| 2 | N+1 Query — DM `getConversations` | `dm.service.ts` | Medium |
| 3 | N+1 Query — Workspace `getUserWorkspaces` | `workspace.service.ts` | Medium |
| 4 | Memory leak — `URL.createObjectURL` ไม่ revoke | `settings/ProfileTab.tsx:61` | Low |
| 5 | Missing useEffect dependency `loadSessions` | `ai-chat/index.tsx:99` | Low |
| 6 | Infinite loop risk — `NotificationBell` useEffect | `NotificationBell.tsx` | Low |
| 7 | `roomNameMap` dependency ทำ re-register ซ้ำ | `useUnreadDMs.ts` | Low |

### 🟡 ควรแก้ถ้ามีเวลา — Maintainability / Clarity

| # | ปัญหา | ไฟล์ | Effort |
|---|-------|------|--------|
| 8 | Duplicate `param` helper ใน 3 routes files | BE: 3 files | Low |
| 9 | Dead code `findWorkspaceMember` ใน message.repository | `message.repository.ts` | Low |
| 10 | `assertWorkspaceMember` ซ้ำ 3 module | BE: 3 files | Low |
| 11 | Merge `mapMessage` + `mapDMMessage` | `chat-rooms/index.tsx` | Low |
| 12 | ใช้ `getInitials()`, `formatTime()` จาก utils | `chat-rooms/index.tsx` | Low |
| 13 | เพิ่ม error log ใน silent `.catch(() => {})` | BE + FE หลายไฟล์ | Low |
| 14 | `leaveWorkspace` → เรียก `removeMember` แทน | `workspace.service.ts` | Low |
| 15 | Export `dmService` จาก `services/index.ts` | `services/index.ts` | Low |
| 16 | type `any` ใน AI service → OpenAI SDK types | `ai.service.ts` | Medium |
| 17 | Sanitize room names ใน AI prompt | `ai.service.ts` | Low |
| 18 | `param()` ใน notification routes — validate empty | `notification.routes.ts` | Low |
| 19 | `_workspaceId` ใน custom-role repository | `custom-role.repository.ts` | Low |

### 🟢 ปรับปรุงระยะยาว — Nice to have

| # | ปัญหา | ไฟล์ | Effort |
|---|-------|------|--------|
| 20 | ย้าย magic numbers → constants (BE + FE) | หลายไฟล์ | Low |
| 21 | แยก `chat-rooms/index.tsx` เป็น hooks | `chat-rooms/index.tsx` | High |
| 22 | ใช้ `UserAvatar` component ให้ครบทุกจุด | หลายไฟล์ | Low |
| 23 | Extract `<CommentSection />` จาก PostCard | `PostCard.tsx` | Medium |
| 24 | รวม brand colors เป็น Tailwind config / constants | หลายไฟล์ | Low |
| 25 | ลบ `AuthResponse` type ที่ไม่ใช้ | `types/user.ts` | Low |
| 26 | Debounce `fetchAndJoin` ใน useUnreadDMs | `useUnreadDMs.ts` | Medium |

---

## ผลกระทบต่อ Behavior ปัจจุบัน

> ก่อนแก้ไขรายการใด ให้ดูตารางนี้ก่อนว่า behavior เดิมจะเปลี่ยนไปหรือไม่

### ✅ แก้ได้เลย — ไม่กระทบผลลัพธ์เดิม

| # | รายการ | เหตุผล |
|---|--------|--------|
| 2, 3 | N+1 DM / Workspace | ผลลัพธ์เดิม แค่เร็วขึ้น |
| 4 | Memory leak URL.createObjectURL | แค่จัดการ memory ผู้ใช้ไม่เห็น |
| 7 | roomNameMap dependency | socket ทำงานเหมือนเดิม |
| 8 | Duplicate `param` helper | refactor ล้วนๆ |
| 9 | Dead code `findWorkspaceMember` | ลบโค้ดที่ไม่ใช้ |
| 10 | Extract `assertWorkspaceMember` | logic เดิมทุกอย่าง |
| 11 | Merge `mapMessage` + `mapDMMessage` | ต้องระวัง `isRead` field ให้ครบ แต่ผลเหมือนเดิม |
| 13 | เพิ่ม error log | เพิ่ม console.warn เท่านั้น user ไม่เห็น |
| 14 | `leaveWorkspace` → `removeMember` | refactor ล้วนๆ |
| 15 | Export `dmService` จาก index | เพิ่ม export ไม่กระทบ runtime |
| 16 | Type `any` → OpenAI SDK types | type-level เท่านั้น ไม่กระทบ runtime |
| 20 | Magic numbers → constants | refactor ล้วนๆ |
| 21 | แยก chat-rooms เป็น hooks | ถ้าทำถูกต้อง ไม่กระทบ |
| 23 | Extract `<CommentSection>` | ถ้าทำถูกต้อง ไม่กระทบ |
| 24, 25 | Brand colors / ลบ AuthResponse | ไม่กระทบ runtime |

---

### ⚠️ แก้ได้แต่ต้องระวัง — กระทบ behavior เล็กน้อย

| # | รายการ | กระทบอะไร |
|---|--------|-----------|
| 1 | `roleName` undefined fix | ตอนนี้ notification ส่ง "@undefined" → หลังแก้จะ **skip** notification นั้นแทน |
| 5 | Missing `loadSessions` dependency | sessions อาจ reload เพิ่มเมื่อ workspace เปลี่ยน — ถูกต้องกว่าเดิม แต่ UI จะ re-fetch |
| 22 | ใช้ `UserAvatar` ทุกจุด | ต้องตรวจว่า `UserAvatar` render ผลเหมือน inline เดิม เพราะอาจมี size/style ต่างกัน |
| 26 | Debounce `fetchAndJoin` | unread count จะ update ช้าลงเล็กน้อยตาม debounce time |

---

### 🚫 แก้แล้วกระทบ behavior ชัดเจน — ต้องทดสอบก่อน

| # | รายการ | กระทบอะไร |
|---|--------|-----------|
| 6 | Infinite loop `NotificationBell` | ถ้ากำลัง loop จริง → แก้แล้วหยุด loop = notification update ช้าลงแต่ถูกต้อง |
| 17 | Sanitize room names ใน AI prompt | ชื่อห้องที่มี backtick/newline จะถูก clean → AI อาจ match ชื่อห้องผิดใน edge case |
| 18 | `param()` validate empty | ตอนนี้ empty param → query ด้วย `""` / หลังแก้ → ส่ง 400 error กลับ |
| 19 | workspaceId check ใน custom-role repository | ตอนนี้อาจ update/delete role ข้าม workspace ได้ → หลังแก้จะ fail = security fix แต่ต้องทดสอบ |

---

> **หมายเหตุ:** ทุกการแก้ไขควรทดสอบ feature ที่เกี่ยวข้องหลังเปลี่ยน
> ลำดับ 1–7 เป็น bug-risk จริง | ลำดับ 8–19 เป็น cleanup ที่ปลอดภัย | ลำดับ 20+ เป็น nice-to-have
