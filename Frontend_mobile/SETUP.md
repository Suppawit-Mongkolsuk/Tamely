# Frontend Mobile — Setup Guide

## สิ่งที่แก้ไขในครั้งนี้

### 1. ระบบ Environment Variable
- สร้าง `lib/config.ts` — export `API_BASE` จาก `EXPO_PUBLIC_API_URL`
- แก้ไข **12 ไฟล์** ที่ hardcode ngrok URL ของเพื่อน ให้ import จาก config แทน
- ไฟล์ที่แก้: `login.tsx`, `workspace.tsx`, `enter-code.tsx`, `feed.tsx`, `chats.tsx`, `profile-edit.tsx`, `alerts.tsx`, `workspace-management.tsx`, `post-detail.tsx`, `chat-room.tsx`, `chat-dm.tsx`, `ai.tsx`

### 2. Google OAuth
- เปลี่ยนจาก Android Client ID (ผูกกับ SHA-1 ของแต่ละเครื่อง) → **Web Client ID** แทน
- ทุกคนใช้ Web Client ID เดียวกันได้เลย ไม่ต้องสร้าง keystore เอง

### 3. Gradle Build Fix
- เพิ่ม `-Duser.language=en -Duser.country=US` ใน `gradle.properties`
- **Root cause:** JVM ใช้ปฏิทินพุทธศักราช (พ.ศ. 2569) ทำให้ Gradle คำนวณ MS-DOS date ผิดพลาด

### 4. expo-dev-client
- ติดตั้ง `expo-dev-client` เพื่อให้ build native app ได้ (Google OAuth ต้องการ native build)

---

## วิธี Setup สำหรับคนที่ Pull โค้ดมาใหม่

### Step 1 — สร้าง `.env.local`
```
EXPO_PUBLIC_API_URL=https://your-ngrok-or-backend-url
```
> ถ้ารัน backend local ให้ใส่ IP จริงของเครื่อง เช่น `http://192.168.x.x:8080`  
> ห้ามใช้ `localhost` บน emulator/มือถือจริง เพราะมันหมายถึงตัวอุปกรณ์ ไม่ใช่เครื่อง Mac

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Build และรัน
```bash
# Android emulator / อุปกรณ์จริง
npx expo run:android

# iOS (ต้องใช้ Mac + Xcode)
npx expo run:ios
```

> **หมายเหตุ:** ต้อง build ใหม่ทุกครั้งที่เพิ่ม/ลบ native package  
> ถ้าแก้แค่ JS/TypeScript ปกติ — reload อย่างเดียวพอ

### Step 4 — เพิ่ม Backend CORS
ใน `Backend/prisma-api/.env` ให้เพิ่ม URL ของ Expo dev server ใน `CLIENT_URL`:
```
CLIENT_URL=http://localhost:3000,http://localhost:5173,http://localhost:8081
```

---

## หมายเหตุ WebRTC (ระบบโทร)
- `react-native-webrtc` ติดตั้งอยู่และพร้อมใช้งาน
- ต้องใช้ผ่าน **native build** (`expo run:android`) เท่านั้น ไม่ทำงานใน Expo Go
- ถ้า build ไม่ผ่านเพราะ webrtc ให้รันก่อน build:
```bash
find node_modules -name "*.jar" -o -name "*.aar" | xargs touch
```
