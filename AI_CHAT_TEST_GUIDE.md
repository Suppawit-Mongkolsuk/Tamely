# AI Chat Test Guide

เอกสารนี้ใช้สำหรับส่งต่องาน AI Chat ให้คนอื่นเอาไปเทสต่อได้ทันที

## Scope ที่ทำเสร็จแล้ว

- Backend endpoint: `POST /api/workspaces/:wsId/ai/chat`
- Frontend web AI page: เรียก API จริงแล้ว ไม่ใช้ mock
- รองรับ AI tools:
  - `get_tasks`
  - `create_task`
  - `get_room_messages`
- มี access control ตาม workspace และ room
- มี conversation history ฝั่ง frontend ส่งย้อนหลัง 10 ข้อความ
- มี `AiSummary` cache และ `AiQuery` log

## ไฟล์สำคัญ

- Backend route: [ai.routes.ts](/Users/title/Documents/Mini%20Project/Tamely/Backend/prisma-api/src/modules/ai/ai.routes.ts)
- Backend service: [ai.service.ts](/Users/title/Documents/Mini%20Project/Tamely/Backend/prisma-api/src/modules/ai/ai.service.ts)
- Backend repository: [ai.repository.ts](/Users/title/Documents/Mini%20Project/Tamely/Backend/prisma-api/src/modules/ai/ai.repository.ts)
- Frontend page: [Frontend_Web/src/features/ai-chat/index.tsx](/Users/title/Documents/Mini%20Project/Tamely/Frontend_Web/src/features/ai-chat/index.tsx)

## Env ที่ต้องใส่เอง

ใน backend `.env` ต้องมีอย่างน้อย:

```env
OPENAI_API_KEY=
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
CLIENT_URL=http://localhost:5173
```

ตอนนี้ `OPENAI_API_KEY` ยังไม่ได้ใส่ intentionally เพื่อให้คุณใส่เอง

## วิธีรัน

### Backend

```bash
cd Backend/prisma-api
npm install
npm run dev
```

### Frontend Web

```bash
cd Frontend_Web
npm install
npm run dev
```

ถ้า backend ไม่ได้รันที่ `http://localhost:8080/api` ให้ตั้ง `VITE_API_URL` ฝั่ง frontend เพิ่มเอง

## API Contract

### Request

`POST /api/workspaces/:wsId/ai/chat`

```json
{
  "message": "ช่วยสรุปห้อง engineering วันนี้ให้หน่อย",
  "history": [
    { "role": "user", "content": "มี task อะไรบ้าง" },
    { "role": "assistant", "content": "..." }
  ]
}
```

### Response

```json
{
  "success": true,
  "data": {
    "reply": "...",
    "toolsUsed": ["get_room_messages"],
    "taskCreated": {
      "id": "...",
      "title": "...",
      "date": "...",
      "priority": "MEDIUM",
      "status": "TODO"
    }
  }
}
```

## เงื่อนไขสำคัญตอนเทส

- ผู้ใช้ต้อง login แล้ว และมี JWT cookie หรือ bearer token
- ผู้ใช้ต้องเป็น member ของ workspace นั้น
- ถ้าจะสรุปห้อง private:
  - `OWNER` และ `ADMIN` เข้าได้ทุกห้อง
  - `MODERATOR` และ `MEMBER` ต้องเป็น `RoomMember`
- ถ้าไม่มี `OPENAI_API_KEY` endpoint จะ error

## Test Checklist

### 1. ถามทั่วไป

ตัวอย่าง:

```text
วันนี้ควรโฟกัสเรื่องอะไรถ้าทีมกำลัง sprint หนัก
```

คาดหวัง:

- AI ตอบเป็นภาษาไทย
- `toolsUsed` อาจเป็น `[]`

### 2. ดึง task

ตัวอย่าง:

```text
วันนี้มี task อะไรบ้าง
```

คาดหวัง:

- AI เรียก `get_tasks`
- ตอบรายการงานใน workspace ปัจจุบัน

### 3. สร้าง task

ตัวอย่าง:

```text
ช่วยสร้าง task ชื่อ prepare demo วันที่ 2026-04-16 priority high
```

คาดหวัง:

- AI เรียก `create_task`
- response มี `taskCreated`
- หน้า web ขึ้น toast ว่าสร้าง task สำเร็จ

### 4. สรุปห้อง

ตัวอย่าง:

```text
ช่วยสรุปห้อง Engineering Team วันนี้ให้หน่อย
```

คาดหวัง:

- AI เรียก `get_room_messages`
- ถ้าห้องมีข้อความเยอะ จะใช้ chunked summarization
- ถ้าขอช่วงเดิมซ้ำ อาจได้ผลจาก `AiSummary` cache

### 5. ไม่มีสิทธิ์เข้าห้อง

ตัวอย่าง:

```text
ช่วยสรุปห้อง private-management วันนี้
```

คาดหวัง:

- AI ไม่ดึงข้อมูลห้องที่ไม่มีสิทธิ์
- ตอบปฏิเสธการเข้าถึง

### 6. ไม่ระบุห้อง

ตัวอย่าง:

```text
ช่วยสรุปการสนทนาให้หน่อย
```

คาดหวัง:

- AI ถามกลับว่าต้องการสรุปห้องไหน

## จุดที่ควรเช็กในฐานข้อมูล

- ตาราง `AiQuery` ควรมี log คำถามและคำตอบ
- ตาราง `AiSummary` ควรมี cache เมื่อมีการสรุปห้องแบบ chunked/final summary
- ตาราง `Task` ควรมี record ใหม่เมื่อ AI สร้าง task
- `Task.createdBy` ควรเป็น `AI`

## หมายเหตุ

- backend build ผ่านแล้ว
- frontend build ผ่านแล้ว
- ตอน build frontend มี warning เก่าเรื่อง circular re-export ของ `useAuthContext` แต่ไม่เกี่ยวกับ AI chat ที่เพิ่มรอบนี้
