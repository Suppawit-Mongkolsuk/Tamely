# CLAUDE.md — Frontend Web (tamely-web)

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix UI primitives)
- **Routing:** React Router DOM v7
- **Real-time:** Socket.IO Client 4
- **Icons:** Lucide React
- **Toast:** Sonner

---

## โครงสร้างโค้ด

```
src/
├── main.tsx                    ← Entry point
├── App.tsx                     ← Root component + router setup
├── Pages/                      ← Page-level components (ใช้ใน router)
│   ├── LandingPage.tsx
│   ├── LoginRegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ResetPasswordPage.tsx
│   ├── HomePage.tsx            ← Feed (โพสต์/ประกาศ)
│   ├── ChatRoomsPage.tsx       ← Room chat + DM
│   ├── CalendarPage.tsx        ← Task / Calendar
│   ├── ManagementPage.tsx      ← จัดการ workspace
│   ├── AIChatPage.tsx          ← AI chat + summarize
│   ├── SettingsPage.tsx
│   └── NotFoundPage.tsx
├── features/                   ← Feature logic (บางส่วน)
│   ├── auth/                   ← login, forgot-password, reset-password
│   ├── home/
│   ├── calendar/
│   ├── chat-rooms/
│   ├── management/
│   ├── ai-chat/
│   ├── settings/
│   └── landing/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx       ← Shell: Sidebar + Header + outlet
│   │   ├── Sidebar.tsx         ← Navigation sidebar
│   │   ├── Header.tsx          ← Top bar
│   │   └── NotificationBell.tsx
│   ├── feed/
│   │   ├── PostCard.tsx        ← แสดงโพสต์ + comment + like
│   │   ├── CreatePostDialog.tsx
│   │   ├── MentionInput.tsx    ← input ที่รองรับ @mention
│   │   └── MentionText.tsx     ← render text ที่มี @mention
│   ├── chat-rooms/
│   │   ├── ChatSidebar.tsx     ← รายชื่อห้อง + DM list
│   │   ├── ChatWindow.tsx      ← แสดงข้อความ + input
│   │   ├── MessageBubble.tsx
│   │   ├── ChatDetailPanel.tsx ← info panel ด้านขวา
│   │   ├── CreateRoomDialog.tsx
│   │   ├── InviteMemberDialog.tsx
│   │   ├── NewDMDialog.tsx
│   │   └── StatusDot.tsx       ← online/offline indicator
│   ├── calendar/
│   │   ├── CalendarGrid.tsx
│   │   ├── CalendarHeader.tsx
│   │   ├── TaskList.tsx
│   │   └── Dialogs.tsx
│   ├── management/
│   │   ├── MembersTab.tsx
│   │   ├── RoomsTab.tsx
│   │   ├── WorkspaceSettingsTab.tsx
│   │   └── Dialogs.tsx
│   ├── ai/
│   │   ├── AIChatHeader.tsx
│   │   ├── AIChatInput.tsx
│   │   ├── AIChatSidebar.tsx
│   │   └── AIMessageBubble.tsx
│   ├── common/
│   │   ├── ProtectedRoute.tsx  ← guard route ที่ต้อง login
│   │   ├── ConfirmDialog.tsx
│   │   ├── RoleBadge.tsx
│   │   └── UserAvatar.tsx
│   └── ui/                     ← shadcn/ui base components
├── contexts/
│   ├── AuthContext.tsx         ← currentUser, login, logout, isAuthenticated
│   ├── WorkspaceContext.tsx    ← currentWorkspace, workspaces, switching
│   └── ThemeContext.tsx
├── hooks/
│   ├── useAuth.ts              ← helper สำหรับดึง AuthContext
│   ├── useWorkspace.ts         ← helper สำหรับดึง WorkspaceContext
│   ├── useChat.ts              ← Socket.IO logic (connect, join room, send/receive)
│   └── useLocalStorage.ts
├── services/                   ← Axios / fetch wrappers เรียก Backend API
│   ├── api.ts                  ← axios instance + interceptors
│   ├── auth.service.ts
│   ├── workspace.service.ts
│   ├── chat.service.ts         ← REST สำหรับดึงข้อความ history
│   ├── dm.service.ts
│   ├── calendar.service.ts
│   └── user.service.ts
├── lib/
│   ├── socket.ts               ← Socket.IO client singleton
│   ├── config.ts               ← env variables (VITE_API_URL etc.)
│   └── utils.ts                ← cn() helper (clsx + tailwind-merge)
├── routes/
│   ├── router.tsx              ← React Router config
│   └── index.ts
└── types/                      ← TypeScript interfaces
    ├── user.ts
    ├── workspace.ts
    ├── chat.ts / chat-ui.ts
    ├── calendar.ts / calendar-ui.ts
    └── management-ui.ts
```

---

## หน้าหลักและ Flow

### Auth Flow
1. **LandingPage** → คลิก Login/Register
2. **LoginRegisterPage** → POST `/api/auth/login` → เก็บ user ใน `AuthContext`
3. **ProtectedRoute** — ถ้าไม่ login จะ redirect กลับ landing

### Workspace Flow
1. หลัง login → `WorkspaceContext` โหลด workspaces ของ user
2. เลือก workspace → ข้อมูลถูก set เป็น `currentWorkspace`
3. ทุก API call ที่ต้องการ workspaceId ดึงจาก context นี้

### Chat Flow (Real-time)
1. `useChat` hook เรียก `lib/socket.ts` → connect Socket.IO
2. `join_room` → ฟัง `message_received`
3. ส่งข้อความ → emit `send_message`
4. Typing → emit `typing` → ฟัง `user_typing`

### DM Flow
1. สร้าง conversation ผ่าน `NewDMDialog` → POST `/api/workspaces/:id/dm`
2. `join_dm` → ฟัง `dm_received`
3. ส่งไฟล์ → POST multipart ไปที่ `/api/.../messages/file`

---

## Contexts

### AuthContext
```ts
{
  user: User | null
  isAuthenticated: boolean
  login(credentials): Promise<void>
  logout(): void
  updateUser(data): void
}
```

### WorkspaceContext
```ts
{
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  setCurrentWorkspace(ws): void
  refreshWorkspaces(): Promise<void>
}
```

---

## Environment Variables

```env
VITE_API_URL=http://localhost:8080    # Backend base URL
VITE_SOCKET_URL=http://localhost:8080 # Socket.IO URL (มักเป็น URL เดียวกัน)
```

---

## การรันโปรเจกต์

```bash
cd Frontend_Web
npm install
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # TypeScript check + Vite build → dist/
npm run preview  # preview production build
```

---

## สิ่งที่ต้องระวัง

- **API base URL** — อยู่ใน `src/lib/config.ts` ดึงจาก `VITE_API_URL`
- **Socket singleton** — `src/lib/socket.ts` export socket instance เดียว ไม่ควรสร้างใหม่ซ้ำ
- **ProtectedRoute** — ใช้ wrap ทุก route ที่ต้อง login
- **Tailwind v4** — ไม่มี `tailwind.config.js` แบบเก่า ใช้ CSS-based config แทน
- **shadcn/ui components** อยู่ใน `src/components/ui/` อย่าแก้ไฟล์ในนั้นโดยตรง
- **mocks/** — ไฟล์ mock data สำหรับ dev/test ที่ยังไม่ได้ต่อ API จริง
