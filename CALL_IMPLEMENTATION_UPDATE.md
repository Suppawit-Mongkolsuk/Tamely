# Call Implementation Update

เอกสารนี้สรุปรายการอัปเดตที่ถูกทำไปแล้วสำหรับระบบโทร 1-1 Voice/Video Call ของ Tamely เพื่อส่งต่อให้ AI หรือ reviewer อีกตัวตรวจทานต่อ

## Scope ที่ทำแล้ว

- เพิ่มระบบ signaling สำหรับ 1-1 call บน Socket.IO backend
- เพิ่ม WebRTC hook/context ฝั่ง Frontend Web
- เพิ่ม UI สำหรับโทรออก, รับสาย, และหน้าคุยสาย
- เพิ่ม Prisma schema + migration สำหรับ `CallLog`

## Backend Updates

### 1. Socket.IO signaling

ไฟล์: `Backend/prisma-api/src/modules/chat/chat.gateway.ts`

สิ่งที่เพิ่ม:

- ใช้ `onlineUsers` เดิมสำหรับยิง event ไปยัง user ปลายทางทุก socket/tab
- เพิ่ม helper `emitToUser(...)`
- เพิ่ม `activeCalls` map สำหรับ track สายที่กำลังคุย
- validate ว่า caller/receiver เป็น participant ของ `DirectConversation` จริง
- ดึง `callerName` จาก conversation เพื่อส่งให้ frontend

events ที่เพิ่ม:

- `call_user`
- `call_accepted`
- `call_rejected`
- `call_ended`
- `webrtc_offer`
- `webrtc_answer`
- `webrtc_ice_candidate`

behavior ที่รองรับ:

- ถ้าปลายทาง offline จะส่ง `call_failed` reason = `user_offline`
- ถ้ารับสาย จะ update active call ของทั้งสองฝั่ง
- ถ้าปฏิเสธสาย จะ clear active call และ update log
- ถ้าวางสาย จะส่ง `call_ended` ให้อีกฝั่งและ update log
- ถ้า disconnect ทั้งหมดทุก tab แล้วกำลังมีสายอยู่ จะถือว่าสายจบ
- ถ้า disconnect แค่ tab เดียว แต่ user ยัง online ผ่าน tab อื่น จะไม่ตัดสาย

### 2. Call logging

ไฟล์:

- `Backend/prisma-api/prisma/schema.prisma`
- `Backend/prisma-api/prisma/migrations/20260412000000_add_call_log/migration.sql`

สิ่งที่เพิ่ม:

- enum `CallType`
- enum `CallStatus`
- model `CallLog`
- relation จาก `User`
- relation จาก `DirectConversation`

fields หลักใน `CallLog`:

- `conversationId`
- `callerId`
- `receiverId`
- `callType`
- `status`
- `startedAt`
- `endedAt`
- `duration`

หมายเหตุ:

- มีไฟล์ migration SQL พร้อมแล้ว
- มีการรัน `npx prisma generate` แล้ว
- ยังไม่ได้รัน `prisma migrate dev` กับฐานข้อมูลจริงในรอบนี้

## Frontend Web Updates

### 1. WebRTC hook

ไฟล์: `Frontend_Web/src/hooks/useWebRTC.ts`

สิ่งที่ทำ:

- สร้าง state กลางของ call:
  - `idle`
  - `calling`
  - `ringing`
  - `connected`
  - `ended`
- ใช้ STUN server:
  - `stun:stun.l.google.com:19302`
  - `stun:stun1.l.google.com:19302`
- จัดการ:
  - `startCall`
  - `acceptCall`
  - `rejectCall`
  - `endCall`
  - `toggleMute`
  - `toggleVideo`
- สร้าง/ปิด `RTCPeerConnection`
- ส่งและรับ SDP offer/answer
- ส่งและรับ ICE candidates
- track `callDuration`
- auto reject สายเรียกเข้าใน 30 วินาที

### 2. WebRTC context/provider

ไฟล์: `Frontend_Web/src/contexts/WebRTCContext.tsx`

สิ่งที่ทำ:

- ทำ provider กลางทั้งแอป
- connect socket เมื่อ user authenticated
- disconnect socket เมื่อ logout/session ไม่พร้อม
- ทำให้ incoming call modal แสดงได้ทุกหน้า

### 3. Call overlay UI

ไฟล์: `Frontend_Web/src/components/call/CallOverlay.tsx`

สิ่งที่ทำ:

- UI สำหรับ `calling`
- UI สำหรับ `incoming call`
- UI สำหรับ active `voice call`
- UI สำหรับ active `video call`
- attach `localStream` / `remoteStream` เข้ากับ audio/video elements

### 4. DM header call actions

ไฟล์:

- `Frontend_Web/src/components/chat-rooms/ChatWindow.tsx`
- `Frontend_Web/src/features/chat-rooms/index.tsx`

สิ่งที่ทำ:

- เพิ่มปุ่ม `Phone` และ `Video` ใน DM header
- ปุ่มแสดงเฉพาะแท็บ DM
- ปุ่ม disabled เมื่อ:
  - user ปลายทาง offline
  - มีสายอื่น active อยู่
- กดแล้วเรียก `startCall(...)`

### 5. App integration

ไฟล์:

- `Frontend_Web/src/App.tsx`
- `Frontend_Web/src/contexts/index.ts`

สิ่งที่ทำ:

- ครอบแอปด้วย `WebRTCProvider`
- render `CallOverlay` ระดับ app

## Verification ที่ทำแล้ว

รันแล้ว:

- `Frontend_Web`: `npm run build`
- `Backend/prisma-api`: `npx prisma generate`
- `Backend/prisma-api`: `npm run build`

ผล:

- frontend build ผ่าน
- backend build ผ่านหลัง generate Prisma client ใหม่

## จุดที่ reviewer ควรตรวจเพิ่ม

- flow จริงระหว่าง browser 2 ฝั่ง:
  - call_user -> incoming_call
  - accept -> offer/answer/ice
  - end/reject/disconnect
- behavior เมื่อเปิดหลาย tab ของ user เดียวกัน
- ความถูกต้องของ `CallLog.status` ในทุก path:
  - offline
  - reject
  - answer แล้ว end
  - disconnect ระหว่างสาย
- UX ของ video/audio overlay บน mobile และ desktop
- กรณี browser block mic/camera permission
- กรณี ICE candidate มาก่อน remote description
- ว่าต้องการ backend REST endpoint สำหรับอ่าน call history เพิ่มหรือไม่

## จุดที่ยังไม่ได้ทำ

- ไม่มี TURN server
- ยังไม่มี ringtone / ringback tone
- ยังไม่มี call history API/หน้าแสดงประวัติการโทร
- ยังไม่มี explicit busy-state event เช่น `user_busy`
- ยังไม่ได้รัน migration กับ database จริง

## ไฟล์หลักที่แก้/เพิ่ม

- `Backend/prisma-api/src/modules/chat/chat.gateway.ts`
- `Backend/prisma-api/prisma/schema.prisma`
- `Backend/prisma-api/prisma/migrations/20260412000000_add_call_log/migration.sql`
- `Frontend_Web/src/hooks/useWebRTC.ts`
- `Frontend_Web/src/contexts/WebRTCContext.tsx`
- `Frontend_Web/src/components/call/CallOverlay.tsx`
- `Frontend_Web/src/components/chat-rooms/ChatWindow.tsx`
- `Frontend_Web/src/features/chat-rooms/index.tsx`
- `Frontend_Web/src/App.tsx`
- `Frontend_Web/src/contexts/index.ts`
