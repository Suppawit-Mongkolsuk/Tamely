# CLAUDE.md — Backend (prisma-api)

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **ORM:** Prisma 6 + PostgreSQL (Supabase)
- **Real-time:** Socket.IO 4
- **Auth:** JWT (httpOnly cookie) + Passport.js (Google / GitHub OAuth)
- **File Storage:** Supabase Storage (multer → buffer → upload)
- **Email:** Resend
- **AI:** OpenAI SDK
- **Validation:** Zod

---

## โครงสร้างโค้ด

```
src/
├── index.ts                   ← Entry point: Express app + Socket.IO + routes mount
├── middlewares/
│   ├── auth.ts                ← authenticate (JWT verify → req.userId)
│   ├── authorize.ts           ← role-based access (OWNER/ADMIN/MODERATOR/MEMBER)
│   ├── error.ts               ← Global error handler (ต้องอยู่ท้ายสุดใน index.ts)
│   ├── upload.middleware.ts   ← multer config (memory storage, file type/size limit)
│   └── validate.ts            ← validateRequest(ZodSchema) + asyncHandler wrapper
├── modules/
│   ├── auth/                  ← Register, Login, Logout, /me, forgot/reset password, avatar
│   ├── oauth/                 ← Google + GitHub OAuth (Passport strategy + callback)
│   ├── workspace/             ← CRUD workspace, invite code, member management
│   ├── room/                  ← CRUD room, room members
│   ├── message/               ← ข้อความใน Room (ดึงประวัติ REST, ส่งจริงผ่าน Socket)
│   ├── dm/                    ← Direct Message 1-1 (conversation + messages + file upload)
│   ├── post/                  ← Feed post, comment, pin, @ mention
│   ├── task/                  ← Task management + Calendar
│   ├── notification/          ← แจ้งเตือน @user / @role
│   └── chat/
│       └── chat.gateway.ts    ← Socket.IO server (events ทั้งหมด)
├── types/
│   ├── auth.types.ts          ← AuthRequest (extends Request + userId)
│   ├── common.types.ts
│   └── index.ts               ← re-export
└── utils/
    ├── jwt.utils.ts           ← signToken, verifyToken, setTokenCookie, clearTokenCookie
    ├── password.hash.ts       ← bcrypt hash + compare
    ├── email.service.ts       ← Resend email sender
    └── supabase-storage.ts    ← upload/delete file ใน Supabase Storage bucket
```

### Pattern ของทุก Module

แต่ละ module มี 4 ไฟล์:

| ไฟล์ | หน้าที่ |
|------|---------|
| `*.model.ts` | Zod schema สำหรับ validate request body |
| `*.repository.ts` | Prisma queries (raw DB access) |
| `*.service.ts` | Business logic (เรียก repository) |
| `*.routes.ts` | Express router + middleware chain |

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | สมัครสมาชิก |
| POST | `/login` | เข้าสู่ระบบ (JWT → cookie) |
| POST | `/logout` | ออกจากระบบ (clear cookie) |
| GET | `/me` | ดูข้อมูลตัวเอง |
| GET | `/token` | รับ fresh token (ใช้ก่อน Socket connect) |
| POST | `/forgot-password` | ส่ง reset link ทางอีเมล |
| POST | `/reset-password` | ตั้งรหัสผ่านใหม่ |
| PATCH | `/profile` | แก้ไข displayName, bio |
| POST | `/avatar` | อัปโหลดรูปโปรไฟล์ |

### OAuth — `/api/oauth`
| Method | Path |
|--------|------|
| GET | `/google` / `/google/callback` |
| GET | `/github` / `/github/callback` |

### Workspace — `/api/workspaces`
| Method | Path |
|--------|------|
| POST | `/` — สร้าง workspace |
| GET | `/` — ดู workspace ของตัวเอง |
| GET | `/:id` — ดูรายละเอียด workspace |
| PATCH | `/:id` — แก้ไข |
| DELETE | `/:id` — ลบ |
| POST | `/:id/join` — เข้าร่วมด้วย invite code |
| GET | `/:id/members` — รายชื่อสมาชิก |
| PATCH | `/:id/members/:userId/role` — เปลี่ยน role |
| DELETE | `/:id/members/:userId` — เตะสมาชิก |

### Room — `/api/workspaces/:workspaceId/rooms`
| Method | Path |
|--------|------|
| GET/POST | `/` |
| GET/PATCH/DELETE | `/:roomId` |
| GET/POST | `/:roomId/members` |
| DELETE | `/:roomId/members/:userId` |

### Message — `/api/rooms/:roomId/messages`
| GET | ดึงประวัติข้อความ (paginated) |
| --- | --- |

### DM — `/api/workspaces/:workspaceId/dm`
| Method | Path |
|--------|------|
| POST | `/` — เริ่ม conversation กับ user |
| GET | `/` — list conversations ของตัวเอง |
| GET | `/:conversationId/messages` — ดึงข้อความ |
| POST | `/:conversationId/messages/file` — อัปโหลดไฟล์ |
| PATCH | `/:conversationId/read` — mark as read |

### Post — `/api/workspaces/:workspaceId/posts`
| GET/POST | `/` |
| GET/PATCH/DELETE | `/:postId` |
| PATCH | `/:postId/pin` |
| GET/POST | `/:postId/comments` |
| DELETE | `/:postId/comments/:commentId` |

### Task — `/api/workspaces/:workspaceId/tasks`
| GET/POST | `/` |
| GET/PATCH/DELETE | `/:taskId` |

### Notification — `/api/workspaces/:workspaceId/notifications`
| GET | `/` — ดึง notification ของตัวเอง |
| PATCH | `/:id/read` — mark as read |
| PATCH | `/read-all` — mark ทั้งหมดว่าอ่านแล้ว |

---

## Socket.IO Events

**Server URL:** เดียวกับ HTTP server (shared port)

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `roomId: string` | เข้าห้อง |
| `leave_room` | `roomId: string` | ออกห้อง |
| `send_message` | `{ roomId, content }` | ส่งข้อความในห้อง |
| `typing` | `{ roomId, isTyping }` | typing indicator |
| `join_dm` | `conversationId: string` | เข้า DM room |
| `leave_dm` | `conversationId: string` | ออก DM room |
| `send_dm` | `{ conversationId, content }` | ส่ง DM |
| `dm_typing` | `{ conversationId, isTyping }` | DM typing |
| `get_online_status` | `userIds: string[]` | ถาม online status |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message_received` | message object | ข้อความใหม่ในห้อง |
| `user_typing` | `{ userId, roomId, isTyping }` | typing indicator |
| `dm_received` | message object | DM ใหม่ |
| `dm_user_typing` | `{ userId, conversationId, isTyping }` | DM typing |
| `user_online` | `{ userId }` | user เชื่อมต่อ |
| `user_offline` | `{ userId }` | user ออกไป |

**Auth Socket:** ส่ง token ใน `socket.handshake.auth.token` หรือผ่าน cookie `accessToken`

---

## Database Schema (Prisma)

ไฟล์: `prisma/schema.prisma`

| Model | หน้าที่ |
|-------|---------|
| `User` | ผู้ใช้งาน (email/password + OAuth) |
| `Workspace` | กลุ่มทำงาน (มี inviteCode) |
| `WorkspaceMember` | ความสัมพันธ์ User↔Workspace + role |
| `Room` | ห้องแชท (Channel) ภายใน Workspace |
| `RoomMember` | สมาชิกในห้อง |
| `Message` | ข้อความใน Room |
| `DirectConversation` | คู่ DM (userA + userB ใน workspace) |
| `DirectMessage` | ข้อความ DM (รองรับ file/image) |
| `Post` | โพสต์ใน Feed (รองรับ imageUrls[], pin) |
| `PostComment` | คอมเมนต์ใต้โพสต์ |
| `Task` | Task ปฏิทิน (ผู้ใช้หรือ AI สร้าง) |
| `AiSummary` | สรุป AI ของห้อง/workspace (cache) |
| `AiQuery` | log คำถาม-คำตอบ AI |
| `Notification` | แจ้งเตือน @ mention (USER/ROLE) |

**Enums:** `WorkspaceRole`, `MessageType`, `TaskPriority`, `TaskStatus`, `TaskCreator`, `MentionTargetType`

---

## Environment Variables ที่ต้องมี

```env
DATABASE_URL=        # Supabase connection pool URL
DIRECT_URL=          # Supabase direct URL (สำหรับ Prisma migration)
PORT=8080
CLIENT_URL=          # comma-separated origins ที่อนุญาต CORS
JWT_SECRET=
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
```

---

## การรันโปรเจกต์

```bash
cd Backend/prisma-api
npm install
npm run dev          # nodemon + ts-node
npm run build        # compile TypeScript
npm start            # run dist/
```

---

## สิ่งที่ต้องระวัง

- **Error handler** (`middlewares/error.ts`) ต้องอยู่ **ท้ายสุด** ใน `index.ts` เสมอ
- **asyncHandler** ต้อง wrap ทุก async route handler เพื่อส่ง error ไป error middleware
- **Socket auth** — ใช้ token จาก cookie หรือ `handshake.auth.token` (ไม่มี session)
- **Supabase Storage** — bucket `chat-files` ต้องมีอยู่ก่อน (auto-create ตอน start server)
- **WorkspaceRole** ลำดับสิทธิ์: OWNER > ADMIN > MODERATOR > MEMBER
