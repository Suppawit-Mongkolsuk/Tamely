# Prompt: Implement 1-1 Voice/Video Call System for Tamely

## Context

Tamely เป็นแอป Team Collaboration (คล้าย Slack) ที่มีระบบ Chat, Feed, Calendar, AI อยู่แล้ว  
ต้องการเพิ่มระบบ **โทร 1-1 (Voice & Video Call)** ผ่าน **WebRTC** โดยใช้ **Socket.IO ที่มีอยู่แล้ว** เป็น Signaling Server  
ใช้ **STUN Server ของ Google** (ฟรี, ไม่ต้อง setup ภายนอก) — ไม่ใช้ TURN Server

---

## Tech Stack ที่เกี่ยวข้อง

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express 5 + TypeScript |
| Real-time | Socket.IO 4.8.3 |
| Database | PostgreSQL (Supabase) + Prisma ORM |
| Frontend Web | React 18 + Vite + TypeScript + Tailwind v4 + shadcn/ui |
| WebRTC | Browser Native API (ไม่ต้องติดตั้ง package เพิ่ม) |
| STUN | `stun:stun.l.google.com:19302` (ฟรี) |

---

## File Paths ที่สำคัญ (ต้องอ่านก่อนเริ่มทำ)

### Backend (`/Backend/prisma-api/`)

| ไฟล์ | หน้าที่ | ทำไมต้องอ่าน |
|------|--------|-------------|
| `src/index.ts` | Server entry, สร้าง httpServer + Socket.IO instance | ดู io instance ถูก init ยังไง |
| `src/modules/chat/chat.gateway.ts` | **Socket.IO event handler หลัก** | ต้องเพิ่ม call signaling events ที่นี่ |
| `src/modules/dm/dm.service.ts` | DM business logic | เข้าใจ DM conversation model |
| `src/modules/dm/dm.routes.ts` | DM REST routes | ดู pattern การเขียน route |
| `prisma/schema.prisma` | Database schema | ดู model ที่มีอยู่ + เพิ่ม CallLog |

### Frontend Web (`/Frontend_Web/`)

| ไฟล์ | หน้าที่ | ทำไมต้องอ่าน |
|------|--------|-------------|
| `src/lib/socket.ts` | Socket.IO client setup | ดูวิธี connect/disconnect + token management |
| `src/lib/config.ts` | API/WS URL config | ดู environment variables |
| `src/features/chat-rooms/index.tsx` | **หน้า Chat หลัก** | ดูวิธีใช้ socket events + UI pattern |
| `src/services/dm.service.ts` | DM API service | ดู pattern การเรียก API |
| `src/hooks/useChat.ts` | Chat hook | ดู pattern การเขียน hook |

---

## สถาปัตยกรรมระบบโทรที่ต้อง Implement

### Call Flow Diagram

```
User A (ผู้โทร)              Server (Socket.IO)              User B (ผู้รับ)
     │                              │                              │
     │  1. call_user ──────────────>│                              │
     │                              │──── 2. incoming_call ───────>│
     │                              │                              │
     │                              │<──── 3a. call_accepted ──────┤
     │  <── 4. call_accepted ───────│                              │
     │                              │                              │
     │  OR                          │                              │
     │                              │<──── 3b. call_rejected ──────┤
     │  <── 4. call_rejected ───────│         (จบ flow)            │
     │                              │                              │
     │  ═══ WebRTC Negotiation (ถ้า accepted) ═══                  │
     │                              │                              │
     │  5. webrtc_offer ───────────>│──── 6. webrtc_offer ────────>│
     │                              │                              │
     │                              │<──── 7. webrtc_answer ───────┤
     │  <── 8. webrtc_answer ───────│                              │
     │                              │                              │
     │  9. ice_candidate ──────────>│──── 10. ice_candidate ──────>│
     │  <── 11. ice_candidate ──────│<──── 12. ice_candidate ──────┤
     │                              │                              │
     │  ════════════ P2P Audio/Video Stream (Direct) ═════════════ │
     │                              │                              │
     │  13. call_ended ────────────>│──── 14. call_ended ─────────>│
     │                              │         (จบ call)            │
```

### Sequence อธิบาย

1. **User A** กดปุ่มโทร → emit `call_user` ไปที่ server
2. **Server** ส่ง `incoming_call` ไปหา **User B** ทุก socket (รองรับหลาย tab)
3. **User B** เลือก รับ (`call_accepted`) หรือ ปฏิเสธ (`call_rejected`)
4. **Server** ส่งผลกลับไปหา **User A**
5. ถ้ารับสาย → เริ่ม WebRTC negotiation (offer → answer → ICE candidates)
6. เมื่อ ICE candidates เชื่อมต่อสำเร็จ → เสียง/วิดีโอไหลตรงระหว่าง 2 คน (P2P)
7. ฝั่งใดฝั่งหนึ่งกดวางสาย → emit `call_ended`

---

## Implementation Details

### Part 1: Backend — Socket.IO Signaling Events

#### ไฟล์: `src/modules/chat/chat.gateway.ts`

เพิ่ม events ต่อไปนี้ใน function ที่ handle socket connection (ที่มี `socket.on('send_message', ...)` อยู่แล้ว)

**ใช้ `onlineUsers` Map ที่มีอยู่แล้ว** (Map<userId, Set<socketId>>) สำหรับหา socket ของ target user

#### Events ที่ต้องเพิ่ม:

```typescript
// === 1-1 Call Signaling Events ===

// 1. ผู้โทรเริ่มโทร
socket.on('call_user', ({ targetUserId, conversationId, callType }) => {
  // callType: 'audio' | 'video'
  // หา socket ทั้งหมดของ target user จาก onlineUsers Map
  // emit 'incoming_call' ไปทุก socket ของ target
  // payload: { callerId: socket.data.userId, callerName, conversationId, callType }
  // ถ้า target ไม่ online → emit 'call_failed' กลับไปหาผู้โทร พร้อม reason: 'user_offline'
});

// 2. ผู้รับสายตอบรับ
socket.on('call_accepted', ({ callerId, conversationId }) => {
  // หา socket ของ caller จาก onlineUsers
  // emit 'call_accepted' ไปหา caller
  // payload: { accepterId: socket.data.userId, conversationId }
});

// 3. ผู้รับสายปฏิเสธ
socket.on('call_rejected', ({ callerId, conversationId }) => {
  // emit 'call_rejected' ไปหา caller
  // payload: { rejecterId: socket.data.userId, conversationId }
});

// 4. วางสาย (ฝั่งไหนก็ได้)
socket.on('call_ended', ({ targetUserId, conversationId }) => {
  // emit 'call_ended' ไปหาอีกฝั่ง
  // payload: { endedBy: socket.data.userId, conversationId }
});

// === WebRTC Signaling (ส่งต่อ SDP + ICE ระหว่าง 2 ฝั่ง) ===

// 5. ส่ง SDP Offer
socket.on('webrtc_offer', ({ targetUserId, offer }) => {
  // offer คือ RTCSessionDescriptionInit object
  // ส่งต่อไปหา target user ทุก socket
  // emit 'webrtc_offer' → { callerId: socket.data.userId, offer }
});

// 6. ส่ง SDP Answer
socket.on('webrtc_answer', ({ targetUserId, answer }) => {
  // answer คือ RTCSessionDescriptionInit object
  // ส่งต่อไปหา caller
  // emit 'webrtc_answer' → { answererId: socket.data.userId, answer }
});

// 7. ส่ง ICE Candidate
socket.on('webrtc_ice_candidate', ({ targetUserId, candidate }) => {
  // candidate คือ RTCIceCandidateInit object
  // ส่งต่อไปหาอีกฝั่ง
  // emit 'webrtc_ice_candidate' → { fromUserId: socket.data.userId, candidate }
});
```

#### Helper Function สำหรับส่ง event ไปหา user:

```typescript
// ใช้ onlineUsers Map ที่มีอยู่แล้ว
function emitToUser(targetUserId: string, event: string, data: any) {
  const targetSockets = onlineUsers.get(targetUserId);
  if (targetSockets) {
    targetSockets.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
    return true; // user is online
  }
  return false; // user is offline
}
```

#### Handle Disconnect ระหว่างโทร:

```typescript
// ใน event 'disconnect' ที่มีอยู่แล้ว ให้เพิ่ม:
// ถ้า user กำลังอยู่ในสาย → emit 'call_ended' ไปหาอีกฝั่ง
// ใช้ Map เก็บ active calls: Map<userId, { peerId, conversationId }>
```

---

### Part 2: Backend — Call Log (Optional แต่แนะนำ)

#### ไฟล์: `prisma/schema.prisma`

เพิ่ม model สำหรับเก็บประวัติการโทร:

```prisma
model CallLog {
  id              String   @id @default(uuid())
  conversationId  String
  callerId        String
  receiverId      String
  callType        CallType @default(AUDIO)
  status          CallStatus @default(MISSED)
  startedAt       DateTime @default(now())
  endedAt         DateTime?
  duration        Int?     // seconds

  conversation    DirectConversation @relation(fields: [conversationId], references: [id])
  caller          User @relation("CallerCalls", fields: [callerId], references: [id])
  receiver        User @relation("ReceiverCalls", fields: [receiverId], references: [id])

  @@index([conversationId, startedAt])
  @@index([callerId])
  @@index([receiverId])
}

enum CallType {
  AUDIO
  VIDEO
}

enum CallStatus {
  MISSED
  REJECTED
  ANSWERED
  ENDED
}
```

อย่าลืมเพิ่ม relation ใน model `User` และ `DirectConversation` ด้วย

หลังเพิ่ม schema แล้ว run:
```bash
npx prisma migrate dev --name add-call-log
```

---

### Part 3: Frontend Web — WebRTC Hook

#### สร้างไฟล์ใหม่: `src/hooks/useWebRTC.ts`

```typescript
// Hook นี้จัดการทุกอย่างเกี่ยวกับ WebRTC call

interface UseWebRTCOptions {
  socket: Socket;
  currentUserId: string;
}

interface CallState {
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  callType: 'audio' | 'video';
  peerId: string | null;
  peerName: string | null;
  conversationId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number; // seconds
}

// สิ่งที่ hook ต้อง return:
interface UseWebRTCReturn {
  callState: CallState;
  startCall: (targetUserId: string, conversationId: string, callType: 'audio' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}
```

#### Logic ภายใน hook:

```typescript
// === ICE Server Config ===
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// === Core Functions ===

// 1. startCall (ผู้โทรเรียกใช้)
async function startCall(targetUserId, conversationId, callType) {
  // a. ขอ permission ใช้ mic/camera
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: callType === 'video',
  });
  setLocalStream(stream);

  // b. emit call_user ไปที่ server
  socket.emit('call_user', { targetUserId, conversationId, callType });

  // c. set status = 'calling' (รอผู้รับ)
  setCallState(prev => ({ ...prev, status: 'calling' }));
}

// 2. acceptCall (ผู้รับเรียกใช้)
async function acceptCall() {
  // a. ขอ permission ใช้ mic/camera
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: callState.callType === 'video',
  });

  // b. emit call_accepted
  socket.emit('call_accepted', { callerId: callState.peerId, conversationId });

  // c. สร้าง RTCPeerConnection
  createPeerConnection(stream);

  // d. set status = 'connected'
}

// 3. createPeerConnection
function createPeerConnection(localStream) {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  // เพิ่ม local tracks
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  // รับ remote tracks
  pc.ontrack = (event) => {
    setRemoteStream(event.streams[0]);
  };

  // ส่ง ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc_ice_candidate', {
        targetUserId: callState.peerId,
        candidate: event.candidate,
      });
    }
  };

  // Monitor connection state
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      endCall();
    }
  };

  return pc;
}

// 4. WebRTC Negotiation (ฝั่งผู้โทร — เมื่อได้ call_accepted)
async function handleCallAccepted() {
  const pc = createPeerConnection(localStream);

  // สร้างและส่ง offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('webrtc_offer', { targetUserId: peerId, offer });
}

// 5. Handle Offer (ฝั่งผู้รับ)
async function handleWebRTCOffer({ callerId, offer }) {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('webrtc_answer', { targetUserId: callerId, answer });
}

// 6. Handle Answer (ฝั่งผู้โทร)
async function handleWebRTCAnswer({ answer }) {
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

// 7. Handle ICE Candidate (ทั้ง 2 ฝั่ง)
async function handleICECandidate({ candidate }) {
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
}

// 8. endCall
function endCall() {
  // a. หยุด local stream tracks
  localStream?.getTracks().forEach(track => track.stop());

  // b. ปิด peer connection
  pc?.close();

  // c. emit call_ended
  socket.emit('call_ended', { targetUserId: peerId, conversationId });

  // d. reset state
  setCallState(initialState);
}

// 9. toggleMute / toggleVideo
function toggleMute() {
  const audioTrack = localStream?.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  }
}

function toggleVideo() {
  const videoTrack = localStream?.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    setIsVideoOff(!videoTrack.enabled);
  }
}
```

#### Socket Events ที่ hook ต้อง listen:

```typescript
useEffect(() => {
  socket.on('incoming_call', handleIncomingCall);
  socket.on('call_accepted', handleCallAccepted);
  socket.on('call_rejected', handleCallRejected);
  socket.on('call_ended', handleCallEnded);
  socket.on('call_failed', handleCallFailed);
  socket.on('webrtc_offer', handleWebRTCOffer);
  socket.on('webrtc_answer', handleWebRTCAnswer);
  socket.on('webrtc_ice_candidate', handleICECandidate);

  return () => {
    socket.off('incoming_call', handleIncomingCall);
    socket.off('call_accepted', handleCallAccepted);
    socket.off('call_rejected', handleCallRejected);
    socket.off('call_ended', handleCallEnded);
    socket.off('call_failed', handleCallFailed);
    socket.off('webrtc_offer', handleWebRTCOffer);
    socket.off('webrtc_answer', handleWebRTCAnswer);
    socket.off('webrtc_ice_candidate', handleICECandidate);
  };
}, [socket]);
```

---

### Part 4: Frontend Web — Call UI Components

#### ต้องสร้าง Components ต่อไปนี้:

#### 4.1 ปุ่มโทรใน DM Chat Header

**ตำแหน่ง:** เพิ่มในส่วน header ของ DM chat (ดู pattern จากหน้า chat ที่มีอยู่)

```
┌─────────────────────────────────────┐
│  Avatar  Username  🟢Online   📞 🎥  │  ← เพิ่มปุ่ม 📞 (voice) และ 🎥 (video)
├─────────────────────────────────────┤
│                                     │
│          Chat Messages              │
│                                     │
└─────────────────────────────────────┘
```

- ปุ่มโทรแสดงเฉพาะเมื่ออยู่ในหน้า DM (ไม่ใช่ Room/Channel)
- ปุ่ม disabled เมื่อ user อีกฝั่ง offline
- ใช้ shadcn/ui `Button` component + Lucide icons (`Phone`, `Video`)

#### 4.2 Calling Overlay (กำลังโทรออก)

**แสดงเมื่อ:** `callState.status === 'calling'`

```
┌─────────────────────────────┐
│                             │
│       Avatar ของผู้รับ        │
│       ชื่อผู้รับ              │
│                             │
│     "กำลังโทร..."            │
│     🔴 วางสาย               │
│                             │
└─────────────────────────────┘
```

- แสดงเป็น full-screen overlay หรือ modal
- มีปุ่มยกเลิก/วางสาย
- เล่นเสียง ringback tone (optional)

#### 4.3 Incoming Call Modal (มีสายเรียกเข้า)

**แสดงเมื่อ:** `callState.status === 'ringing'`

```
┌─────────────────────────────┐
│                             │
│       Avatar ของผู้โทร        │
│       ชื่อผู้โทร              │
│    "สายเรียกเข้า (Voice)"    │
│                             │
│    🟢 รับสาย    🔴 ปฏิเสธ    │
│                             │
└─────────────────────────────┘
```

- แสดงเป็น modal ที่ตรงกลางหน้าจอ
- **ต้องแสดงได้ทุกหน้า** (ไม่ใช่เฉพาะหน้า chat) → ใส่ไว้ที่ layout level
- เล่นเสียง ringtone (optional)
- Auto-reject หลัง 30 วินาที ถ้าไม่รับ

#### 4.4 Active Call Screen (กำลังสนทนา)

**แสดงเมื่อ:** `callState.status === 'connected'`

**Voice Call:**
```
┌─────────────────────────────┐
│                             │
│       Avatar ของอีกฝั่ง       │
│       ชื่อ                   │
│       00:05:23 (duration)   │
│                             │
│   🎤 Mute   🔴 วางสาย       │
│                             │
└─────────────────────────────┘
```

**Video Call:**
```
┌─────────────────────────────┐
│                             │
│    ┌───────────────────┐    │
│    │                   │    │
│    │  Remote Video     │    │
│    │  (เต็มจอ)         │    │
│    │                   │    │
│    │         ┌──────┐  │    │
│    │         │Local │  │    │
│    │         │Video │  │    │
│    │         └──────┘  │    │
│    └───────────────────┘    │
│                             │
│  🎤 Mute  📷 Off  🔴 End   │
│                             │
└─────────────────────────────┘
```

- ใช้ `<video>` element สำหรับแสดง stream
- Local video: `videoRef.srcObject = localStream` (มุมเล็กขวาล่าง)
- Remote video: `videoRef.srcObject = remoteStream` (เต็มจอ)
- มี call timer แสดงระยะเวลาสนทนา
- ปุ่ม: Mute/Unmute, Camera On/Off (video call), End Call

#### 4.5 Component Structure

```
src/
├── features/
│   └── call/
│       ├── components/
│       │   ├── CallButton.tsx          ← ปุ่มโทรใน DM header
│       │   ├── IncomingCallModal.tsx    ← modal รับสายเรียกเข้า
│       │   ├── CallingOverlay.tsx       ← overlay กำลังโทรออก
│       │   ├── ActiveCallScreen.tsx     ← หน้าจอระหว่างสนทนา
│       │   └── CallTimer.tsx           ← แสดงเวลาสนทนา
│       └── hooks/
│           └── useWebRTC.ts            ← WebRTC logic hook
```

---

### Part 5: Integration — วาง Call Provider ที่ Layout Level

#### เหตุผล:
สายเรียกเข้าต้องแสดงได้ **ทุกหน้า** ไม่ใช่เฉพาะหน้า chat

#### วิธี:

สร้าง `CallProvider` (React Context) ครอบ app ใน layout:

```typescript
// src/features/call/CallProvider.tsx

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const webrtc = useWebRTC({ socket, currentUserId: user.id });

  return (
    <CallContext.Provider value={webrtc}>
      {children}

      {/* Modal/Overlay ที่แสดงทุกหน้า */}
      {webrtc.callState.status === 'ringing' && <IncomingCallModal />}
      {webrtc.callState.status === 'calling' && <CallingOverlay />}
      {webrtc.callState.status === 'connected' && <ActiveCallScreen />}
    </CallContext.Provider>
  );
};

// Hook สำหรับ component อื่นๆ เรียกใช้
export const useCall = () => useContext(CallContext);
```

วาง `<CallProvider>` ใน layout ที่ครอบทุกหน้า (ดู layout ปัจจุบันของโปรเจกต์)

---

### Part 6: Edge Cases ที่ต้อง Handle

| สถานการณ์ | วิธีจัดการ |
|-----------|----------|
| ผู้รับ offline | emit `call_failed` กลับไปหาผู้โทร + แสดง toast "ผู้ใช้ไม่ออนไลน์" |
| ผู้รับไม่รับสายภายใน 30 วินาที | Auto-cancel call + emit `call_ended` + แสดง "ไม่มีคนรับสาย" |
| ผู้โทร disconnect ระหว่างโทร | Server ตรวจจับ disconnect → emit `call_ended` ไปหาอีกฝั่ง |
| ผู้รับ disconnect ระหว่างโทร | `pc.onconnectionstatechange` จะเป็น 'disconnected' → endCall() |
| กำลังโทรอยู่แล้วมีสายเข้าอีก | Auto-reject สายใหม่ + emit `call_rejected` พร้อม reason: 'busy' |
| Browser ไม่รองรับ WebRTC | ตรวจสอบ `navigator.mediaDevices` ก่อน → แสดง error ถ้าไม่มี |
| User ไม่อนุญาต mic/camera | catch `getUserMedia` error → แสดง toast แจ้งเตือน |
| Network เปลี่ยนระหว่างโทร | `pc.oniceconnectionstatechange` → ถ้า 'failed' ลอง ICE restart |

---

### Part 7: Active Call Tracking (Backend)

เพื่อ handle edge cases ให้ดี ต้องเก็บ state ของสายที่กำลังโทรอยู่:

```typescript
// เพิ่มใน chat.gateway.ts

// Map เก็บสายที่ active อยู่: userId → { peerId, conversationId, callType }
const activeCalls = new Map<string, {
  peerId: string;
  conversationId: string;
  callType: 'audio' | 'video';
  startedAt: Date;
}>();

// เมื่อ call_accepted → set ทั้ง 2 ฝั่ง
// เมื่อ call_ended → delete ทั้ง 2 ฝั่ง
// เมื่อ disconnect → ถ้ามีใน activeCalls → emit call_ended ไปหา peer + delete
// เมื่อ call_user → ถ้า target มีใน activeCalls → emit call_failed reason: 'busy'
```

---

## ลำดับการ Implement (แนะนำ)

### Step 1: Backend Signaling
1. อ่าน `chat.gateway.ts` ให้เข้าใจ pattern ปัจจุบัน
2. เพิ่ม `activeCalls` Map + `emitToUser` helper
3. เพิ่ม call signaling events ทั้ง 7 ตัว
4. เพิ่ม disconnect handling สำหรับ active calls
5. (Optional) เพิ่ม CallLog model ใน schema.prisma + migrate

### Step 2: Frontend Hook
1. อ่าน `socket.ts` + `useChat.ts` ให้เข้าใจ pattern
2. สร้าง `useWebRTC.ts` hook
3. ทดสอบ hook ด้วย console.log ก่อน (ยังไม่ต้องมี UI)

### Step 3: Frontend UI
1. สร้าง `CallProvider` + Context
2. สร้าง `IncomingCallModal` (รับสาย)
3. สร้าง `CallingOverlay` (โทรออก)
4. สร้าง `ActiveCallScreen` (voice + video)
5. สร้าง `CallButton` + เพิ่มใน DM header

### Step 4: Integration & Testing
1. วาง `CallProvider` ใน layout
2. ทดสอบ voice call (เปิด 2 browser tabs)
3. ทดสอบ video call
4. ทดสอบ edge cases (วางสาย, ปฏิเสธ, offline, timeout)
5. ทดสอบข้ามเครือข่าย (ใช้ hotspot มือถือ)

---

## ICE Server Configuration

```typescript
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};
```

ใช้ STUN อย่างเดียว — ไม่ต้อง setup อะไรภายนอก, ไม่ต้องสมัครบัญชี, ฟรี 100%

**Limitation:** อาจเชื่อมต่อไม่ได้ในเครือข่ายที่ใช้ Symmetric NAT (WiFi มหาลัย/องค์กรบางที่)

---

## สิ่งที่ไม่ต้องทำ (Out of Scope)

- Group call (โทรกลุ่ม) — ทำแค่ 1-1
- Screen sharing — ไม่จำเป็นสำหรับ Mini Project
- Call recording — ไม่จำเป็น
- TURN server — ใช้ STUN อย่างเดียว
- Mobile (React Native) — ทำ Web ก่อน, mobile ค่อยว่ากัน
- End-to-end encryption — WebRTC มี DTLS/SRTP encryption มาในตัวอยู่แล้ว
