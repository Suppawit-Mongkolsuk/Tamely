# Custom Roles & Permissions System — Implementation Plan

> เป้าหมาย: ระบบยศและสิทธิ์แบบ Discord ที่ OWNER สร้างยศเองได้ กำหนดสิทธิ์แต่ละยศได้ และมอบยศให้สมาชิกได้

---

## สารบัญ

1. [สถานะปัจจุบัน](#1-สถานะปัจจุบัน)
2. [Permission List](#2-permission-list)
3. [Database Schema ใหม่](#3-database-schema-ใหม่)
4. [Backend — ทุกจุดที่ต้องแก้](#4-backend--ทุกจุดที่ตองแก)
5. [API Endpoints ใหม่](#5-api-endpoints-ใหม่)
6. [Frontend — ทุกจุดที่ต้องแก้](#6-frontend--ทุกจุดที่ตองแก)
7. [Migration Plan (Phase)](#7-migration-plan-phase)
8. [ผลกระทบและ Breaking Changes ที่ต้องรับรู้](#8-ผลกระทบและ-breaking-changes-ที่ต้องรับรู้)
9. [สิ่งที่อาจจำเป็นเพิ่มเติม](#9-สิ่งที่อาจจำเป็นเพิ่มเติม)

---

## 1. สถานะปัจจุบัน

ระบบปัจจุบันใช้ **enum แข็งตัว** ใน Prisma:

```prisma
enum WorkspaceRole {
  OWNER
  ADMIN
  MODERATOR   // ← ถูก define ไว้แต่ไม่มี logic ใช้จริงเลย
  MEMBER
}
```

**ข้อจำกัด:**
- ไม่สามารถสร้างยศใหม่ได้
- สิทธิ์ผูกกับ enum โดยตรง ทุก service check แบบ `if (role !== 'OWNER' && role !== 'ADMIN')`
- MODERATOR มีสิทธิ์เท่ากับ MEMBER ในทางปฏิบัติ (ไม่ได้ใช้เลย)

---

## 2. Permission List

สิทธิ์ที่เสนอสำหรับ Tamely (เรียงตามกลุ่ม):

```typescript
// ไฟล์ใหม่: src/types/permissions.ts
export const PERMISSIONS = {
  // Workspace Management
  MANAGE_WORKSPACE:    'MANAGE_WORKSPACE',    // แก้ชื่อ/คำอธิบาย/icon workspace
  MANAGE_ROLES:        'MANAGE_ROLES',        // สร้าง/แก้/ลบ custom roles
  MANAGE_MEMBERS:      'MANAGE_MEMBERS',      // เชิญ/เตะสมาชิก, เปลี่ยน role
  REGENERATE_INVITE:   'REGENERATE_INVITE',   // สร้าง invite code ใหม่

  // Channel / Room
  MANAGE_CHANNELS:     'MANAGE_CHANNELS',     // สร้าง/แก้/ลบห้อง
  VIEW_PRIVATE_CHANNELS: 'VIEW_PRIVATE_CHANNELS', // เข้าห้อง private ได้

  // Messages
  SEND_MESSAGES:       'SEND_MESSAGES',       // ส่งข้อความในห้อง
  DELETE_OWN_MESSAGES: 'DELETE_OWN_MESSAGES', // ลบข้อความตัวเอง
  DELETE_ANY_MESSAGE:  'DELETE_ANY_MESSAGE',  // ลบข้อความคนอื่น

  // Posts / Feed
  CREATE_POST:         'CREATE_POST',         // สร้างโพสต์/ประกาศ
  DELETE_ANY_POST:     'DELETE_ANY_POST',     // ลบโพสต์คนอื่น
  PIN_POST:            'PIN_POST',            // ปักหมุดโพสต์
  DELETE_ANY_COMMENT:  'DELETE_ANY_COMMENT',  // ลบคอมเมนต์คนอื่น

  // Tasks
  CREATE_TASK:         'CREATE_TASK',         // สร้าง task
  ASSIGN_TASK:         'ASSIGN_TASK',         // มอบหมาย task ให้คนอื่น
  DELETE_ANY_TASK:     'DELETE_ANY_TASK',     // ลบ task คนอื่น

  // AI
  USE_AI:              'USE_AI',              // ใช้ AI chat / AI สรุป

  // Mentions
  MENTION_ROLE:        'MENTION_ROLE',        // @ยศ เพื่อ notify ทั้งกลุ่ม
} as const

export type Permission = keyof typeof PERMISSIONS
```

### Default Permission ของแต่ละ Built-in Role

| Permission | OWNER | ADMIN | MODERATOR | MEMBER |
|---|:---:|:---:|:---:|:---:|
| MANAGE_WORKSPACE | ✅ | ✅ | ❌ | ❌ |
| MANAGE_ROLES | ✅ | ❌ | ❌ | ❌ |
| MANAGE_MEMBERS | ✅ | ✅ | ❌ | ❌ |
| REGENERATE_INVITE | ✅ | ❌ | ❌ | ❌ |
| MANAGE_CHANNELS | ✅ | ✅ | ❌ | ❌ |
| VIEW_PRIVATE_CHANNELS | ✅ | ✅ | ❌ | ❌ |
| SEND_MESSAGES | ✅ | ✅ | ✅ | ✅ |
| DELETE_OWN_MESSAGES | ✅ | ✅ | ✅ | ✅ |
| DELETE_ANY_MESSAGE | ✅ | ✅ | ✅ | ❌ |
| CREATE_POST | ✅ | ✅ | ✅ | ❌ |
| DELETE_ANY_POST | ✅ | ✅ | ❌ | ❌ |
| PIN_POST | ✅ | ✅ | ✅ | ❌ |
| DELETE_ANY_COMMENT | ✅ | ✅ | ✅ | ❌ |
| CREATE_TASK | ✅ | ✅ | ✅ | ✅ |
| ASSIGN_TASK | ✅ | ✅ | ✅ | ❌ |
| DELETE_ANY_TASK | ✅ | ✅ | ❌ | ❌ |
| USE_AI | ✅ | ✅ | ✅ | ✅ |
| MENTION_ROLE | ✅ | ✅ | ✅ | ❌ |

> OWNER มีสิทธิ์ทุกอย่างเสมอ ไม่สามารถถอดได้

---

## 3. Database Schema ใหม่

### เพิ่ม 2 Model ใน `prisma/schema.prisma`

```prisma
// ยศที่ OWNER สร้างเองได้ (Custom Role ต่อ Workspace)
model CustomRole {
  id          String   @id @default(uuid()) @db.Uuid
  workspaceId String   @db.Uuid
  name        String                        // "Developer", "Designer", ฯลฯ
  color       String   @default("#6B7280")  // hex color
  position    Int      @default(0)          // ลำดับ (สูงกว่า = มีสิทธิ์ชนะเมื่อ conflict)
  permissions String[] @default([])         // ["SEND_MESSAGES", "CREATE_POST", ...]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace          @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  members     CustomRoleMember[]

  @@unique([workspaceId, name])
  @@index([workspaceId])
}

// ความสัมพันธ์ Member ↔ CustomRole (many-to-many)
model CustomRoleMember {
  id           String     @id @default(uuid()) @db.Uuid
  workspaceId  String     @db.Uuid
  customRoleId String     @db.Uuid
  userId       String     @db.Uuid
  assignedAt   DateTime   @default(now())

  workspace    Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  customRole   CustomRole @relation(fields: [customRoleId], references: [id], onDelete: Cascade)
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([customRoleId, userId])
  @@index([workspaceId, userId])
}
```

### เพิ่ม Relation ใน User และ Workspace

```prisma
// ใน model User เพิ่ม:
customRoles  CustomRoleMember[]

// ใน model Workspace เพิ่ม:
customRoles       CustomRole[]
customRoleMembers CustomRoleMember[]
```

### Migration ที่ต้องสร้าง

```bash
npx prisma migrate dev --name add_custom_roles
```

---

## 4. Backend — ทุกจุดที่ต้องแก้

### 4.1 สร้าง Permission Helper (ไฟล์ใหม่)

**`src/utils/permissions.ts`** — ฟังก์ชันหลักที่ทุกอย่าง call

```typescript
import { WorkspaceRole } from '@prisma/client'
import { Permission, BUILT_IN_ROLE_PERMISSIONS } from '../types/permissions'

// ดึง effective permissions ของ user ใน workspace
export async function resolveUserPermissions(
  workspaceId: string,
  userId: string
): Promise<Set<Permission>>

// เช็คว่า user มี permission นี้ไหม
export async function hasPermission(
  workspaceId: string,
  userId: string,
  permission: Permission
): Promise<boolean>

// เช็คหลาย permission พร้อมกัน (AND)
export async function hasAllPermissions(
  workspaceId: string,
  userId: string,
  permissions: Permission[]
): Promise<boolean>
```

---

### 4.2 ไฟล์ที่ต้องแก้ทีละจุด

#### `src/middlewares/authorize.ts`
**ปัจจุบัน:** `requireWorkspaceAdmin`, `requireWorkspaceOwner`
**แก้เป็น:** `requirePermission(permission: Permission)` middleware factory

```typescript
// ก่อน
if (member.role !== 'ADMIN' && member.role !== 'OWNER') throw 403

// หลัง
export const requirePermission = (permission: Permission) =>
  asyncHandler(async (req, res, next) => {
    const allowed = await hasPermission(workspaceId, req.userId!, permission)
    if (!allowed) throw new AppError(403, 'Insufficient permissions')
    next()
  })
```

---

#### `src/modules/workspace/workspace.service.ts`

| ฟังก์ชัน | บรรทัดที่แก้ | เปลี่ยนจาก → เป็น |
|---|---|---|
| `updateWorkspace()` | ~56 | `role !== OWNER && role !== ADMIN` → `hasPermission(MANAGE_WORKSPACE)` |
| `addMemberByEmail()` | ~97 | `role !== OWNER && role !== ADMIN` → `hasPermission(MANAGE_MEMBERS)` |
| `removeMember()` | ~143 | `role !== OWNER && role !== ADMIN` → `hasPermission(MANAGE_MEMBERS)` |
| `updateMemberRole()` | ~162 | `ownerId !== requesterId` → `hasPermission(MANAGE_MEMBERS)` |
| `deleteWorkspace()` | ~72 | `ownerId !== userId` → OWNER only (ไม่เปลี่ยน) |
| `regenerateInviteCode()` | ~179 | `ownerId !== userId` → `hasPermission(REGENERATE_INVITE)` |

---

#### `src/modules/room/room.service.ts`

| ฟังก์ชัน | บรรทัดที่แก้ | เปลี่ยนจาก → เป็น |
|---|---|---|
| `assertWorkspaceAdmin()` helper | ~16 | `role !== OWNER && role !== ADMIN` → ลบทิ้ง ใช้ `hasPermission` แทน |
| `createRoom()` | ~24 | `assertWorkspaceAdmin()` → `hasPermission(MANAGE_CHANNELS)` |
| `updateRoom()` | ~99 | `role !== OWNER && role !== ADMIN` → `hasPermission(MANAGE_CHANNELS)` |
| `deleteRoom()` | ~119 | `role !== OWNER && role !== ADMIN` → `hasPermission(MANAGE_CHANNELS)` |
| `addRoomMember()` | ~131 | `assertWorkspaceAdmin()` → `hasPermission(MANAGE_CHANNELS)` |
| `removeRoomMember()` | ~176 | `role !== OWNER && role !== ADMIN` → `hasPermission(MANAGE_CHANNELS)` |
| `getRooms()` filter | ~41 | ส่ง `member.role` → เพิ่ม custom role permissions เข้าไปด้วย |

> **หมายเหตุ `getRooms()`:** Room มี `allowedRoles: WorkspaceRole[]` อยู่แล้ว ถ้าอยากให้ custom role เข้าห้อง private ได้ต้องเพิ่ม `allowedCustomRoles: String[]` (customRoleId[]) ใน Room model ด้วย

---

#### `src/modules/post/post.service.ts`

| ฟังก์ชัน | บรรทัดที่แก้ | เปลี่ยนจาก → เป็น |
|---|---|---|
| `createPost()` | ~24 | `role !== OWNER && role !== ADMIN` → `hasPermission(CREATE_POST)` |
| `updatePost()` | ~86 | `role !== OWNER && role !== ADMIN` → `hasPermission(DELETE_ANY_POST)` (ถ้าไม่ใช่ author) |
| `deletePost()` | ~106 | `role !== OWNER && role !== ADMIN` → `hasPermission(DELETE_ANY_POST)` (ถ้าไม่ใช่ author) |
| `togglePin()` | ~125 | `role !== OWNER && role !== ADMIN` → `hasPermission(PIN_POST)` |
| `deleteComment()` | ~190 | `role !== OWNER && role !== ADMIN` → `hasPermission(DELETE_ANY_COMMENT)` (ถ้าไม่ใช่ author) |

---

#### `src/modules/message/message.service.ts`

ปัจจุบันไม่มี role check — แต่ต้องเพิ่ม:

| ฟังก์ชัน | เพิ่มใหม่ |
|---|---|
| `deleteMessage()` | ถ้าไม่ใช่ owner message → `hasPermission(DELETE_ANY_MESSAGE)` |

---

#### `src/modules/task/task.service.ts`

| ฟังก์ชัน | บรรทัดที่แก้ | เปลี่ยนจาก → เป็น |
|---|---|---|
| `createTask()` | ไม่มี check | เพิ่ม `hasPermission(CREATE_TASK)` (ถ้าอยากจำกัด) |
| `updateTask()` | ไม่มี check | เพิ่ม `hasPermission(ASSIGN_TASK)` เฉพาะเมื่อเปลี่ยน assigneeId |
| `deleteTask()` | ~80 | `role !== OWNER && role !== ADMIN` → `hasPermission(DELETE_ANY_TASK)` |

---

#### `src/modules/notification/` (@ mention)

ปัจจุบัน `Notification.targetRole` เป็น `WorkspaceRole` enum — ถ้าอยากให้ @customRole ได้ต้องเพิ่ม:
- `targetCustomRoleId String? @db.Uuid` ใน `Notification` model
- Logic ใน notification service ที่ resolve ว่าใครต้องได้รับ notification เมื่อ @customRole

---

#### `src/modules/chat/chat.gateway.ts`

Socket events ส่วนใหญ่ delegate ไปที่ service อยู่แล้ว ไม่ต้องแก้มาก แต่ต้องเพิ่ม:
- `send_message` event → check `hasPermission(SEND_MESSAGES)` ถ้าอยากจำกัด

---

#### `src/modules/room/room.repository.ts`

`findMany()` ที่ filter ด้วย `allowedRoles` (บรรทัด ~67):
- ปัจจุบัน: `allowedRoles: { has: userRole }`
- ถ้าเพิ่ม `allowedCustomRoles` ใน Room → ต้อง query เพิ่มว่า user มี custom role ที่อยู่ใน list ไหม

---

### 4.3 สร้าง Module ใหม่

**`src/modules/custom-role/`** — 4 ไฟล์ตาม pattern เดิม:

```
custom-role.model.ts     ← Zod schemas (CreateCustomRoleSchema, UpdateCustomRoleSchema)
custom-role.repository.ts ← Prisma queries
custom-role.service.ts    ← Business logic + permission guards
custom-role.routes.ts     ← Express router
```

---

## 5. API Endpoints ใหม่

ทั้งหมด mount ใน `src/index.ts`

```
# Custom Roles CRUD
GET    /api/workspaces/:id/roles                         ← list ยศทั้งหมดใน workspace
POST   /api/workspaces/:id/roles                         ← สร้างยศใหม่ [MANAGE_ROLES]
PATCH  /api/workspaces/:id/roles/:roleId                 ← แก้ยศ (ชื่อ/สี/สิทธิ์) [MANAGE_ROLES]
DELETE /api/workspaces/:id/roles/:roleId                 ← ลบยศ [MANAGE_ROLES]
PATCH  /api/workspaces/:id/roles/reorder                 ← เรียงลำดับยศใหม่ [MANAGE_ROLES]

# Assign/Revoke Role to Member
GET    /api/workspaces/:id/members/:userId/roles         ← ดูยศของสมาชิก
POST   /api/workspaces/:id/members/:userId/roles         ← ให้ยศ [MANAGE_ROLES]
DELETE /api/workspaces/:id/members/:userId/roles/:roleId ← เอายศคืน [MANAGE_ROLES]
```

---

## 6. Frontend — ทุกจุดที่ต้องแก้

### 6.1 Services

**`src/services/workspace.service.ts`** — เพิ่ม:
```typescript
getCustomRoles(workspaceId): Promise<CustomRole[]>
createCustomRole(workspaceId, data): Promise<CustomRole>
updateCustomRole(workspaceId, roleId, data): Promise<CustomRole>
deleteCustomRole(workspaceId, roleId): Promise<void>
assignCustomRole(workspaceId, userId, roleId): Promise<void>
revokeCustomRole(workspaceId, userId, roleId): Promise<void>
getMemberCustomRoles(workspaceId, userId): Promise<CustomRole[]>
```

---

### 6.2 Management Page

**`src/components/management/WorkspaceSettingsTab.tsx`**
- ส่วน "ยศและสิทธิ์" ตอนนี้ใช้ `mockRoles` → ต้องเชื่อม `chatService.getCustomRoles()`
- ปุ่ม "สร้างยศ" → เชื่อม `CreateRoleDialog` กับ API จริง
- ปุ่ม Edit (ดินสอ) → เปิด EditRoleDialog ที่ต่อ API

**`src/components/management/Dialogs.tsx`** — `CreateRoleDialog`
- ตอนนี้ form ไม่ได้ save อะไร → ต้องเพิ่ม `onSubmit` prop และ call API
- เพิ่ม permission checklist จาก `PERMISSIONS` list

**`src/components/management/MembersTab.tsx`**
- เพิ่ม column/chip แสดง custom roles ของสมาชิกแต่ละคน
- เพิ่ม UI assign/revoke role

---

### 6.3 Guards / Permission Check (Frontend)

**`src/lib/permissions.ts`** (ไฟล์ใหม่) — helper สำหรับ frontend:
```typescript
// เช็คจาก currentWorkspace.myPermissions (ถ้าเพิ่ม field นี้ใน API response)
export function canDo(permission: Permission): boolean
```

**`src/features/management/index.tsx`**
- ตอนนี้ `canManageMembers` เช็คจาก `role === 'OWNER' || role === 'ADMIN'`
- ต้องเปลี่ยนเป็น `canDo('MANAGE_MEMBERS')`

### 6.4 Mobile App Impact

ถึงแม้แผนหลักจะเขียนฝั่ง Web ไว้ก่อน แต่ของจริง **Mobile ก็ได้รับผลกระทบด้วย** เพราะตอนนี้ยังผูกกับ enum role แบบแข็งหลายจุด เช่น:

- `Frontend_mobile/components/ui/Header.tsx`
  - แสดง label/color ของ `OWNER/ADMIN/MODERATOR/MEMBER`
  - Logic เปลี่ยน role สมาชิกยังคิดแบบ OWNER/ADMIN เท่านั้น
  - ถ้า backend เริ่มใช้ custom role แล้ว mobile จะยังไม่รู้จัก role ใหม่ทันที

- `Frontend_mobile/app/(tabs)/alerts.tsx`
  - การแสดงผล notification แบบ `@Role` ยังอิง `targetRole`

- `Frontend_mobile/app/(tabs)/feed.tsx`, `Frontend_mobile/app/(tabs)/chats.tsx`
  - มี UI ที่แสดง/ตีความ role แบบ fixed set

**ข้อสรุป:** ถ้าจะ rollout ระบบนี้จริง ไม่ควรนับว่าเป็นงาน backend + web only ต้องมี phase สำหรับ mobile อย่างน้อยในระดับ
- แสดง custom role badges/chips
- ใช้ `myPermissions` แทน role-based guard
- รองรับ notification / mention payload แบบใหม่

---

## 7. Migration Plan (Phase)

### Phase 1 — Custom Role CRUD (ไม่กระทบ logic เดิม)
- [ ] เพิ่ม `CustomRole` + `CustomRoleMember` ใน schema
- [ ] Run migration
- [ ] สร้าง `custom-role` module (model/repo/service/routes)
- [ ] เพิ่ม API endpoints
- [ ] เชื่อม frontend WorkspaceSettingsTab → ยศและสิทธิ์ section

### Phase 2 — Permission Helper
- [ ] สร้าง `src/types/permissions.ts` (permission constants + built-in defaults)
- [ ] สร้าง `src/utils/permissions.ts` (`hasPermission`, `resolveUserPermissions`)
- [ ] สร้าง `requirePermission()` middleware ใหม่

### Phase 3 — Migrate Authorization (ทีละ module)
- [ ] `workspace.service.ts`
- [ ] `room.service.ts` + `room.repository.ts`
- [ ] `post.service.ts`
- [ ] `message.service.ts`
- [ ] `task.service.ts`
- [ ] `chat.gateway.ts`
- [ ] `ai.repository.ts` / จุดที่ AI ใช้ role เช็คสิทธิ์เข้าห้องหรือสร้าง task

### Phase 4 — Frontend Permission Check
- [ ] เพิ่ม `myPermissions: string[]` ใน workspace API response
- [ ] สร้าง `src/lib/permissions.ts`
- [ ] เปลี่ยน canManage guards ใน components
- [ ] เปลี่ยน route guards / management guards จาก role-based เป็น permission-based
- [ ] เลิกพึ่ง `mockRoles` ในหน้า management และเชื่อม custom role API จริง

### Phase 4.5 — Mobile Alignment
- [ ] เพิ่ม `myPermissions: string[]` ใน response ที่ mobile ใช้
- [ ] เปลี่ยน mobile guards จาก role-based เป็น permission-based
- [ ] รองรับ custom roles ใน header / members / alerts / feed

### Phase 5 — Custom Role @ Mention (optional)
- [ ] เพิ่ม `targetCustomRoleId` ใน `Notification` model
- [ ] แก้ mention resolution logic
- [ ] แก้ `MentionInput.tsx` ให้ suggest custom roles ด้วย

---

## 8. ผลกระทบและ Breaking Changes ที่ต้องรับรู้

### 8.1 Schema / Data Model Impact

การเพิ่ม `CustomRole` และ `CustomRoleMember` **ไม่ใช่แค่เพิ่ม table ใหม่** แต่จะเปลี่ยน mental model ของระบบจาก:

- เดิม: 1 สมาชิก = 1 role (`WorkspaceMember.role`)
- ใหม่: 1 สมาชิก = 1 built-in role + 0..n custom roles

ผลที่ตามมา:
- ทุกจุดที่ใช้ `WorkspaceMember.role` เพื่อตัดสินสิทธิ์โดยตรงต้องถูก review ใหม่
- built-in role ยังหายไปไม่ได้ เพราะยังถูกใช้เป็น base role, owner semantics, และ compatibility กับข้อมูลเดิม
- ต้องระวังไม่ให้ query เดิมเข้าใจผิดว่า `role` คือสิทธิ์ทั้งหมดของ user

### 8.2 Authorization Impact (Backend)

ปัจจุบัน authorization กระจายอยู่หลาย service แบบ hardcode `OWNER/ADMIN`:

- workspace
- room
- post
- task
- message
- notification mention logic
- AI repository / helper บางจุด

ดังนั้นถ้าสร้าง `hasPermission()` แต่ migrate ไม่ครบ จะเกิดปัญหา:
- บาง endpoint อนุญาตตาม permission ใหม่
- แต่บาง endpoint ยัง block ตาม role เก่า
- ผลลัพธ์คือ user คนเดียวกันอาจ "เข้า UI ได้แต่ยิง API ไม่ผ่าน" หรือ "ทำบาง action ได้ไม่ครบ"

**สรุป:** งานนี้ต้องมองเป็น auth refactor ทั้งระบบ ไม่ใช่ feature module เดี่ยว

### 8.3 API Contract Impact

ตอนนี้ request/response หลายจุดยัง design รอบ enum role แบบแข็ง:

- invite member รับ role ได้แค่ `MEMBER` / `ADMIN`
- update member role ยังรับ enum role
- room create รับ `allowedRoles`
- workspace response ส่ง `role` แต่ยังไม่มี `myPermissions`
- notification payload ส่ง `targetRole`

ผลกระทบ:
- frontend จะยัง infer สิทธิ์จาก role เดิมต่อไป ถ้าไม่เพิ่ม field ใหม่
- mobile/web ทั้งสองฝั่งจะมองไม่เห็น custom role permissions
- `@customRole` จะทำไม่ได้จนกว่า API/DB ของ notification จะขยาย

### 8.4 Room Access Impact

จุดนี้เป็น **hidden dependency ที่สำคัญมาก**

ตอนนี้ห้อง private ใช้:
- `Room.allowedRoles: WorkspaceRole[]`
- query แบบ `allowedRoles has userRole`

ดังนั้นแม้จะมี custom role แล้ว:
- user ที่ได้ custom role สำหรับเข้าห้อง private จะยังเข้าไม่ได้
- room list, room visibility, และ management dialog จะยังคิดตาม built-in role เท่านั้น

ถ้าต้องการให้ custom role มีผลกับห้องจริง ต้องเพิ่ม field เช่น:

```prisma
allowedCustomRoleIds String[] @default([])
```

แล้วแก้ครบทั้ง:
- schema
- zod validation
- room repository query
- create/update room API
- UI เลือกสิทธิ์ห้อง

### 8.5 Mention / Notification Impact

ระบบ mention ตอนนี้ resolve role จาก alias ที่ map ไป `WorkspaceRole` โดยตรง เช่น `@Admin`, `@Moderator`

ผลกระทบ:
- custom role จะไม่สามารถถูก mention ได้ทันที
- notification table ยังเก็บได้แค่ `targetRole`
- UI notification ฝั่ง web/mobile ก็ยังรู้จักแต่ built-in roles

ดังนั้น `@customRole` ควรถูกนับเป็น **phase optional ที่มีผลกระทบข้าม backend + web + mobile**

### 8.6 AI Module Impact

ในโค้ดปัจจุบันมี logic ฝั่ง AI บางจุดที่ยังเช็ค `OWNER/ADMIN` โดยตรงเพื่อ:
- bypass การเข้าถึง room
- ดึงรายการห้องที่เข้าถึงได้
- สร้าง task จาก AI flow

ถ้าไม่ migrate ส่วนนี้:
- สิทธิ์ของ AI feature จะไม่ตรงกับระบบหลัก
- user ที่มี custom permission อาจใช้ feature ปกติได้ แต่ AI ทำ action เดียวกันไม่ได้

### 8.7 Frontend Web Impact

ฝั่ง Web ยังมี dependency กับ role-based logic หลายจุด:

- route guard หน้า management
- `currentWorkspace.role === 'OWNER' || 'ADMIN'`
- components badge / mention suggestion / post moderation / calendar assign / sidebar access
- หน้า Workspace Settings ใช้ `mockRoles`

ผลกระทบ:
- ถ้า backend เปลี่ยนแล้ว web ยังเช็ค role เดิม UI จะ authorize ผิด
- หน้า role management จะดูเหมือนรองรับ แต่ยังไม่ใช้งานจริง

### 8.8 Mobile Impact

ฝั่ง Mobile ตอนนี้ hardcode role labels, color, และ role transition logic อยู่แล้ว

ผลกระทบ:
- custom role ใหม่จะแสดงไม่ถูกหรือไม่แสดงเลย
- mobile management behavior จะไม่ตรงกับ web/backend
- notification / mention payload แบบใหม่อาจ render ไม่ครบ

### 8.9 Breaking Behavior ที่ควรยอมรับล่วงหน้า

หลังเปลี่ยนเป็น permission-based จะมี behavior เปลี่ยนจริง เช่น:

- user ที่ไม่ใช่ `ADMIN` แต่อยู่ใน custom role ที่มี `CREATE_POST` จะสร้างโพสต์ได้
- user ที่มีหลาย custom roles จะได้สิทธิ์แบบ union
- built-in `MODERATOR` จะเริ่มมีความหมายจริง ไม่ใช่แค่ enum ที่แทบไม่ได้ใช้

เพราะฉะนั้นนี่ไม่ใช่แค่ technical refactor แต่เป็น **product behavior change**

### 8.10 Recommendation เพื่อลดผลกระทบ

ลำดับที่ปลอดภัยที่สุด:

1. เพิ่ม schema + custom role CRUD + list/assign API ก่อน
2. เพิ่ม `permissions.ts`, `resolveUserPermissions()`, `hasPermission()`
3. เพิ่ม `myPermissions` ใน workspace/member-related responses
4. migrate backend authorization ทีละ module
5. migrate web guards
6. migrate mobile guards
7. ค่อยเปิด `@customRole` และ private room custom access

ถ้าข้ามลำดับนี้ มีโอกาสสูงที่จะเกิด:
- UI ผ่าน แต่ API ไม่ผ่าน
- mobile/web behavior ไม่ตรงกัน
- สิทธิ์ห้อง / AI / notification ไม่สอดคล้องกัน

---

## 9. สิ่งที่อาจจำเป็นเพิ่มเติม

### 9.1 Room Access Control สำหรับ Custom Role
ตอนนี้ `Room.allowedRoles` เป็น `WorkspaceRole[]` — ถ้าอยากให้ custom role เข้าห้อง private ได้ต้องเพิ่ม field ใน Room:

```prisma
model Room {
  // ... fields เดิม
  allowedCustomRoleIds String[] @default([])  // customRoleId[] ที่เข้าได้
}
```

และแก้ `room.repository.ts` ให้ JOIN กับ `CustomRoleMember` ด้วย

---

### 9.2 Role Hierarchy (Position)
ถ้า user มีหลาย custom role สิทธิ์จะ **union** (รวมกันทั้งหมด) — แบบ Discord
- role A มี `SEND_MESSAGES`
- role B มี `CREATE_POST`
- user ได้ทั้งสอง role → มีทั้ง `SEND_MESSAGES` และ `CREATE_POST`

Position ใช้สำหรับตัดสินเรื่อง **ใครให้/เอายศใครได้** — คนที่มี position สูงกว่าเท่านั้นที่จัดการยศ position ต่ำกว่าได้

---

### 9.3 Permission Cache
`hasPermission()` ต้อง query DB ทุกครั้ง → อาจช้าถ้าถูก call บ่อย พิจารณา:
- Cache permission ใน Redis (TTL ~5 นาที) — ถ้า scale ขึ้นในอนาคต
- ตอนนี้โปรเจกยังเล็ก ยังไม่จำเป็น

---

### 9.4 Audit Log (Optional)
เพิ่ม `RoleAuditLog` model เก็บว่าใครให้/เอายศใครเมื่อไหร่ — สำคัญถ้า workspace ใหญ่ขึ้น

---

### 9.5 `MODERATOR` Built-in Role
ตอนนี้ `MODERATOR` มีอยู่ใน enum แต่ไม่มี logic — ถ้าทำ permission system ใหม่ควรกำหนด default permissions ให้ MODERATOR ชัดเจน (ดูตารางใน section 2)

---

*อัปเดตล่าสุด: 2026-04-17*
