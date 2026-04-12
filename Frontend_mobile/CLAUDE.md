# CLAUDE.md — Frontend Mobile (frontend_mobile)

## Tech Stack

- **Framework:** React Native 0.81 + Expo SDK 54
- **Router:** Expo Router v6 (file-based routing)
- **Styling:** NativeWind v4 (Tailwind CSS สำหรับ React Native)
- **Icons:** Lucide React Native + @expo/vector-icons
- **Auth Session:** expo-auth-session (OAuth flow)

---

## โครงสร้างโค้ด

```
app/                            ← Expo Router pages (file-based routing)
├── _layout.tsx                 ← Root layout (fonts, auth guard)
├── index.tsx                   ← Entry redirect
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx               ← หน้า Login
│   ├── register.tsx            ← หน้า Register
│   ├── enter-code.tsx          ← กรอก invite code เข้า workspace
│   └── test-auth.tsx           ← dev test screen
├── (tabs)/                     ← Main app (bottom tab navigation)
│   ├── _layout.tsx             ← Tab bar config
│   ├── feed.tsx                ← Feed/ประกาศ
│   ├── chats.tsx               ← Chat rooms + DM list
│   ├── alerts.tsx              ← Notifications
│   ├── ai.tsx                  ← AI Chat
│   └── profile.tsx             ← โปรไฟล์ผู้ใช้
└── (workspace)/
    ├── _layout.tsx
    └── workspace.tsx           ← หน้าเลือก/จัดการ workspace

components/
├── chat/
│   ├── ChatListItem.tsx        ← แสดงรายการ chat ใน list
│   ├── SearchBar.tsx
│   ├── WorkspaceHeader.tsx     ← Header แสดงชื่อ workspace
│   └── AIBanner.tsx            ← Banner ชวนใช้ AI
└── ui/
    ├── Avatar.tsx
    ├── Badge.tsx
    ├── DecBubble.tsx           ← Decoration bubble
    ├── Header.tsx
    └── WorkspaceCard.tsx
```

---

## Expo Router — การทำงานของ Routes

Expo Router ใช้ folder/file เป็น route โดยอัตโนมัติ:

| Path | Route |
|------|-------|
| `app/index.tsx` | `/` |
| `app/(auth)/login.tsx` | `/login` |
| `app/(tabs)/feed.tsx` | `/feed` (Tab) |
| `app/(workspace)/workspace.tsx` | `/workspace` |

- `(auth)`, `(tabs)`, `(workspace)` คือ **route groups** — ชื่อ folder ไม่ปรากฏใน URL
- `_layout.tsx` ในแต่ละ folder กำหนด shell/navigator ของ group นั้น

---

## Screens และหน้าที่

| Screen | หน้าที่ |
|--------|---------|
| `login.tsx` | Login ด้วย email/password หรือ OAuth |
| `register.tsx` | สมัครสมาชิก |
| `enter-code.tsx` | กรอก invite code เข้า workspace |
| `feed.tsx` | ดูโพสต์/ประกาศภายใน workspace |
| `chats.tsx` | รายการห้องแชทและ DM |
| `alerts.tsx` | การแจ้งเตือน @ mention |
| `ai.tsx` | คุยกับ AI + ขอสรุปบทสนทนา |
| `profile.tsx` | ดู/แก้ไขโปรไฟล์ |
| `workspace.tsx` | เลือกหรือจัดการ workspace |

---

## NativeWind Styling

ใช้ `className` prop เหมือน Tailwind บน React Native:

```tsx
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold text-gray-900">Hello</Text>
</View>
```

- Config อยู่ใน `tailwind.config.js`
- Global styles อยู่ใน `app/global.css`
- ต้อง import `global.css` ใน root `_layout.tsx`

---

## การรันโปรเจกต์

```bash
cd Frontend_mobile
npm install
npm start           # Expo dev server (scan QR code ด้วย Expo Go)
npm run ios         # iOS Simulator
npm run android     # Android Emulator
```

---

## สิ่งที่ต้องระวัง

- **Expo Router** — ชื่อไฟล์คือ route โดยตรง ระวังชื่อซ้ำกับ route อื่น
- **NativeWind v4** — ต้องใช้ `nativewind-env.d.ts` และ `metro.config.js` ที่ config ไว้แล้ว
- **expo-auth-session** — ใช้สำหรับ OAuth ผ่าน browser redirect (ต่างจาก Web ที่ใช้ Passport)
- **React Native 0.81 + React 19** — ระวัง API ที่เปลี่ยนใน React 19
- **Mobile scope** — แอปมือถือนี้เป็นส่วน **read/view** เป็นหลัก การจัดการ workspace ที่ซับซ้อน (เช่น management) ทำบน Web

---

## Feature Status ของ Mobile

| Feature | Status |
|---------|--------|
| Auth (Login/Register) | ทำแล้ว |
| Feed (ดูโพสต์) | ทำแล้ว |
| Chat list UI | ทำแล้ว |
| Notifications/Alerts | ทำแล้ว |
| AI Chat | ทำแล้ว |
| Real-time Socket.IO | กำลังทำ |
| DM | กำลังทำ |
| Workspace management | ยังไม่ทำ (ทำบน Web) |
