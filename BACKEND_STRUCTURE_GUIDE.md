# Backend Structure Guide — Tamely

เอกสารนี้สรุปโครงสร้าง Backend ของโปรเจกต์ Tamely จากโฟลเดอร์ `Backend/prisma-api/src`

อ้างอิงหลักจาก:
- `Backend/prisma-api/src/index.ts`
- `Backend/prisma-api/src/middlewares/*`
- `Backend/prisma-api/src/modules/*`
- `Backend/prisma-api/src/types/*`
- `Backend/prisma-api/src/utils/*`

---

## ส่วนที่ 1: สรุปเร็วว่า Backend มีอะไรบ้าง

### ภาพรวมสถาปัตยกรรม

Backend นี้เป็นแบบ **Modular Monolith + Layered Architecture**

- **Modular Monolith**
  ระบบยังเป็น backend ก้อนเดียว ไม่ได้แยกเป็นหลาย service
- **Layered Architecture**
  ในแต่ละโมดูลแยกหน้าที่เป็นชั้น ๆ เช่น route, service, repository, model
- **Real-time Layer**
  ใช้ Socket.IO สำหรับ chat, DM, online status และ call events

### โครงสร้างระดับบน

| ส่วน | หน้าที่หลัก |
|---|---|
| `index.ts` | จุดเริ่มระบบ สร้าง Express app, mount routes, init Socket.IO |
| `middlewares/` | ตัวกรอง request และตัวช่วยกลาง เช่น auth, validate, upload, error |
| `modules/` | ฟีเจอร์หลักของระบบ เช่น auth, workspace, room, message, dm, post, task, ai |
| `types/` | type และ error class ที่ใช้ร่วมกัน |
| `utils/` | helper กลาง เช่น JWT, password hash, storage, permissions, email |
| `prisma/` | schema และการเชื่อมต่อ database ผ่าน Prisma |

### Pattern ของแต่ละโมดูล

| ไฟล์ | หน้าที่ |
|---|---|
| `*.routes.ts` | รับ request, ใส่ middleware, ส่งต่อไป service |
| `*.model.ts` | schema validation ด้วย Zod |
| `*.service.ts` | business logic หลัก |
| `*.repository.ts` | คำสั่ง query database ผ่าน Prisma |

หมายเหตุ:
- ไม่ใช่ทุกโมดูลจะมีครบ 4 ไฟล์
- บางโมดูลเป็น service-only หรือ gateway-only เช่น `push`, `chat`

### รายชื่อโมดูลหลัก

| Module | หน้าที่หลัก |
|---|---|
| `auth` | สมัคร, login, logout, profile, forgot/reset password |
| `oauth` | Google/GitHub OAuth |
| `workspace` | จัดการ workspace และสมาชิก |
| `custom-role` | role แบบกำหนดเองและ permissions |
| `room` | ห้องแชทใน workspace |
| `message` | ข้อความใน room |
| `dm` | direct message แบบ 1-1 |
| `chat` | Socket.IO gateway สำหรับ real-time |
| `post` | feed, post, comment, pin, mention |
| `task` | task และ calendar |
| `notification` | การแจ้งเตือน |
| `ai` | AI chat, summary, session, query log |
| `push` | ส่ง push notification ผ่าน Expo |
| `user` | route จัดการ push token ของ user |

### Middlewares หลัก

| Middleware | หน้าที่ |
|---|---|
| `auth.ts` | ตรวจ JWT และใส่ `req.userId` |
| `authorize.ts` | ตรวจ role/สิทธิ์ระดับ workspace |
| `validate.ts` | validate body/query/params และ wrap async route |
| `upload.middleware.ts` | รับและจำกัดไฟล์อัปโหลดด้วย multer |
| `error.ts` | global error handler |

### Utilities หลัก

| Utility | หน้าที่ |
|---|---|
| `jwt.utils.ts` | sign/verify token และจัดการ cookie |
| `password.hash.ts` | hash และ compare password |
| `email.service.ts` | ส่งอีเมล |
| `permissions.ts` | คำนวณ permission จาก role และ custom role |
| `supabase-storage.ts` | upload/delete ไฟล์ใน Supabase Storage |

---

## ส่วนที่ 2: รายละเอียดโครงสร้าง Backend

## 1. `index.ts`

### หน้าที่
เป็น entry point ของ backend ใช้ประกอบระบบทั้งหมดเข้าด้วยกัน

### สิ่งที่ไฟล์นี้ทำ
- โหลด environment variables
- สร้าง `Express app`
- สร้าง `HTTP server`
- สร้าง `PrismaClient`
- ลง global middlewares
- mount routes ของแต่ละโมดูล
- เรียก `initSocketIO(...)`
- start server
- จัดการ graceful shutdown ของ Prisma

### บทบาทในระบบ
- เป็นศูนย์กลางการประกอบระบบ
- ไม่ควรใส่ business logic ลึก ๆ ในไฟล์นี้
- เป็นจุดที่ดูได้ทันทีว่า backend เปิดใช้ feature อะไรอยู่จริง

### สิ่งสำคัญที่ mount อยู่จริง
- `/api/auth`
- `/api/oauth`
- `/api/workspaces`
- custom-role, room, message, post, task, notification, dm, ai ผ่าน `/api`

### ข้อสังเกต
- โมดูล `user` มี route file อยู่ แต่จาก `index.ts` ปัจจุบันยังไม่เห็นถูก mount

---

## 2. `middlewares/`

โฟลเดอร์นี้เก็บตัวช่วยกลางที่ทำงานก่อนหรือหลัง route handler

## 2.1 `auth.ts`

### หน้าที่
ตรวจสอบ JWT token จาก cookie หรือ Authorization header

### ใช้ทำอะไร
- ป้องกัน route ที่ต้อง login
- เติม `req.userId` เพื่อให้ service รู้ว่า request นี้มาจากใคร

### ลักษณะการทำงาน
- ลองดึง token จาก cookie ก่อน
- ถ้าไม่มี ค่อยลองจาก Bearer token
- ถ้า token ใช้ไม่ได้ จะตอบ `401`

---

## 2.2 `authorize.ts`

### หน้าที่
ตรวจสอบสิทธิ์ระดับ workspace เช่น owner หรือ admin

### ใช้ทำอะไร
- จำกัด action ที่เฉพาะ admin/owner เท่านั้นทำได้
- query ข้อมูล role จาก database โดยตรง

### ลักษณะการทำงาน
- อ่าน `workspaceId` จาก params หรือ query
- ตรวจสถานะสมาชิกหรือ owner
- ถ้าไม่ผ่านจะตอบ `403`

---

## 2.3 `validate.ts`

### หน้าที่
ตรวจสอบ request input และช่วยจัดการ async route

### ส่วนประกอบหลัก
- `validateRequest(schema)`
  ใช้ Zod ตรวจ `body`, `params`, `query`
- `asyncHandler(fn)`
  ใช้ครอบ async route handler เพื่อส่ง error ต่อได้ถูกทาง

### ใช้ทำอะไร
- กันข้อมูลไม่ถูกต้องก่อนเข้า service
- ลดการเขียน `try/catch` ซ้ำใน routes

---

## 2.4 `upload.middleware.ts`

### หน้าที่
สร้าง multer middleware สำหรับรับไฟล์อัปโหลด

### ใช้ทำอะไร
- จำกัดขนาดไฟล์
- จำกัด MIME type
- ใช้ `memoryStorage()` เพื่อเก็บไฟล์ใน buffer ชั่วคราวก่อนส่งต่อไป storage

### ตัวอย่าง upload ที่เตรียมไว้แล้ว
- avatar upload
- post image upload
- chat file upload
- workspace icon upload

---

## 2.5 `error.ts`

### หน้าที่
เป็น global error handler ของระบบ

### ใช้ทำอะไร
- แปลง error ให้เป็น HTTP response ที่สม่ำเสมอ
- รองรับหลายประเภท เช่น
  - `AppError`
  - JWT error
  - Prisma error
  - JSON parse error

### บทบาทสำคัญ
- ต้องอยู่ท้ายสุดของ middleware chain ใน `index.ts`

---

## 3. `modules/`

โฟลเดอร์นี้คือแกนหลักของ backend โดยแยกตาม feature

## 3.1 โครงแบบมาตรฐานของ 1 โมดูล

### `routes`
รับ request จาก client และกำหนดเส้นทาง API

### `model`
กำหนด validation schema ด้วย Zod

### `service`
เก็บ business logic และประสานงานหลายส่วนเข้าด้วยกัน

### `repository`
เป็นชั้นที่คุยกับ Prisma/database โดยตรง

### ข้อดีของการแยกแบบนี้
- route ไม่อ้วนเกินไป
- business logic ไม่ปนกับ query database
- ทดสอบและแก้เฉพาะจุดได้ง่ายขึ้น

---

## 3.2 `auth`

### หน้าที่
จัดการ authentication แบบปกติของระบบ

### ดูแลเรื่องอะไรบ้าง
- register
- login
- logout
- restore session ผ่าน `/me`
- forgot password
- reset password
- update profile
- upload avatar

### โครงสร้าง
- `auth.model.ts`
- `auth.repository.ts`
- `auth.routes.ts`
- `auth.service.ts`

---

## 3.3 `oauth`

### หน้าที่
จัดการการเข้าสู่ระบบผ่าน Google และ GitHub

### ดูแลเรื่องอะไรบ้าง
- ตั้งค่า Passport strategy
- route สำหรับ redirect ไป provider
- callback route หลัง login สำเร็จ

### จุดสำคัญ
- ใช้ `oauth.config.ts` สำหรับ config
- เชื่อมกับระบบ user/account หลักของโปรเจกต์

---

## 3.4 `workspace`

### หน้าที่
จัดการหน่วยหลักของระบบคือ workspace

### ดูแลเรื่องอะไรบ้าง
- สร้าง workspace
- ดู workspace ของ user
- join ด้วย invite code
- แก้ไขหรือลบ workspace
- ดูและจัดการสมาชิก

### ความสำคัญ
- เป็น root context ของฟีเจอร์อื่นเกือบทั้งหมด

---

## 3.5 `custom-role`

### หน้าที่
จัดการ custom role และ permission เพิ่มเติม

### ดูแลเรื่องอะไรบ้าง
- สร้าง role เอง
- แก้ไขชื่อ/สี/permission
- ลบ role
- assign หรือ revoke role ให้สมาชิก

### ความสำคัญ
- ทำให้ระบบสิทธิ์ยืดหยุ่นเกินกว่า built-in role ปกติ

---

## 3.6 `room`

### หน้าที่
จัดการห้องแชทใน workspace

### ดูแลเรื่องอะไรบ้าง
- สร้างและแก้ไข room
- ลบ room
- จัดการสมาชิกในห้อง
- ตรวจสิทธิ์การเข้าห้อง private/public

### ความสำคัญ
- เป็นพื้นที่หลักสำหรับ chat แบบกลุ่ม

---

## 3.7 `message`

### หน้าที่
จัดการข้อความใน room chat

### ดูแลเรื่องอะไรบ้าง
- ดึงประวัติข้อความ
- ส่งข้อความ
- mark as read
- ลบข้อความ
- รองรับข้อความปกติและไฟล์

### ความสัมพันธ์
- ทำงานร่วมกับ `room`
- ใช้ `push.service` สำหรับแจ้งเตือนบางกรณี
- ใช้ Socket.IO ผ่าน `chat.gateway.ts`

---

## 3.8 `dm`

### หน้าที่
จัดการ direct message แบบ 1-1

### ดูแลเรื่องอะไรบ้าง
- สร้าง conversation
- list conversation
- ดึงข้อความ DM
- ส่งข้อความหรือไฟล์
- mark as read
- unread count

### ความสำคัญ
- แยก flow ออกจาก room chat เพราะ logic อ่าน/ยังไม่อ่านต่างกัน

---

## 3.9 `chat`

### หน้าที่
เป็น real-time gateway ของระบบผ่าน Socket.IO

### ไฟล์หลัก
- `chat.gateway.ts`

### ดูแลเรื่องอะไรบ้าง
- socket authentication
- `join_room`, `leave_room`
- `send_message`, `typing`
- `join_dm`, `leave_dm`
- `send_dm`, `dm_typing`
- online/offline status
- call signaling และ call events

### ความสำคัญ
- เป็นชั้น event-driven ของ backend
- ทำให้ระบบ chat และ call เป็น real-time

---

## 3.10 `post`

### หน้าที่
จัดการ feed และประกาศภายใน workspace

### ดูแลเรื่องอะไรบ้าง
- สร้าง post
- แก้ไข/ลบ post
- pin post
- เพิ่ม/ลบ comment
- จัดการ mention และ notification ที่เกิดจาก post/comment

### ความสำคัญ
- ทำหน้าที่คล้าย feed ประกาศในทีม

---

## 3.11 `task`

### หน้าที่
จัดการ task และข้อมูลปฏิทิน

### ดูแลเรื่องอะไรบ้าง
- สร้าง task
- update status
- ลบ task
- query task ตาม workspace, วันที่, assignee, status

### ความสำคัญ
- เป็นส่วนของ productivity และ calendar

---

## 3.12 `notification`

### หน้าที่
จัดการ notification ของผู้ใช้

### ดูแลเรื่องอะไรบ้าง
- list notifications
- mark as read
- mark all as read
- สร้าง notification จาก mention user หรือ role

### ความสัมพันธ์
- เชื่อมกับ `post`, `postComment`, และบางส่วนของ socket/push

---

## 3.13 `ai`

### หน้าที่
จัดการฟีเจอร์ AI ทั้งหมด

### ดูแลเรื่องอะไรบ้าง
- รับคำถามจาก user
- สร้างคำตอบจาก OpenAI
- สรุปบทสนทนา
- จัดการ AI session
- log คำถาม/คำตอบ
- เรียกใช้ tool ภายในระบบ เช่น task หรือ summary

### ความสำคัญ
- เป็นชั้น integration ระหว่างระบบ collaboration กับ AI assistant

---

## 3.14 `push`

### หน้าที่
เป็น service ภายในสำหรับส่ง push notification

### ไฟล์หลัก
- `push.service.ts`

### ดูแลเรื่องอะไรบ้าง
- ดึง push token ของผู้ใช้
- สร้าง payload
- ส่ง notification ไป Expo Push API

### หมายเหตุ
- เป็น service สนับสนุน ไม่ใช่โมดูล API เต็มรูปแบบ

---

## 3.15 `user`

### หน้าที่
ตอนนี้ใช้สำหรับ route ที่เกี่ยวกับ push token ของ user

### ดูแลเรื่องอะไรบ้าง
- update push token
- ลบ push token ตอน logout หรือเลิกใช้งาน

### ข้อสังเกต
- มีไฟล์ `user.routes.ts`
- แต่ใน `index.ts` ปัจจุบันยังไม่เห็นถูก mount เข้าระบบ

---

## 4. `types/`

โฟลเดอร์นี้เก็บ type กลางที่หลายส่วนใช้ร่วมกัน

## 4.1 `common.types.ts`

### ใช้เก็บอะไร
- `AuthRequest`
  request ที่ต่อยอดจาก Express Request และเพิ่ม `userId`
- `ApiResponse<T>`
  รูปแบบ response ทั่วไป
- `PaginatedResponse<T>`
  รูปแบบ response แบบแบ่งหน้า
- `AppError`
  custom error class สำหรับ service layer

### ความสำคัญ
- ทำให้ route, service, middleware ใช้ type ร่วมกันได้ชัดเจน

---

## 4.2 `auth.types.ts`

### ใช้เก็บอะไร
- payload ของ register/login
- response ของ login
- JWT payload

### ความสำคัญ
- ใช้ประกอบ auth flow ให้ type-safe มากขึ้น

---

## 4.3 `permissions.ts`

### ใช้เก็บอะไร
- permission values
- role-permission mapping
- helper type ของ permission

### ความสำคัญ
- เป็นฐานของระบบ authorization ที่ละเอียดกว่าระดับ role ธรรมดา

---

## 5. `utils/`

โฟลเดอร์นี้เก็บ helper function ที่ reuse ได้ทั้งระบบ

## 5.1 `jwt.utils.ts`

### หน้าที่
จัดการทุกเรื่องที่เกี่ยวกับ JWT และ cookie auth

### ดูแลเรื่องอะไรบ้าง
- sign token
- verify token
- set cookie
- clear cookie
- extract Bearer token
- sign/verify reset password token

---

## 5.2 `password.hash.ts`

### หน้าที่
hash password และ compare password

### ใช้ทำอะไร
- ใช้ใน register/login/reset password

---

## 5.3 `email.service.ts`

### หน้าที่
ส่งอีเมลออกจากระบบ

### ใช้ทำอะไร
- password reset
- notification ทางอีเมลในอนาคต

---

## 5.4 `permissions.ts`

### หน้าที่
คำนวณ permission จริงของผู้ใช้จาก built-in role และ custom role

### ดูแลเรื่องอะไรบ้าง
- resolve permission ทั้งชุดของ user
- check permission เดี่ยว
- check หลาย permission
- แปลง permission ออกมาเป็น array

### ความสำคัญ
- เป็นแกน authorization เชิง business logic

---

## 5.5 `supabase-storage.ts`

### หน้าที่
จัดการ upload/delete ไฟล์กับ Supabase Storage

### ดูแลเรื่องอะไรบ้าง
- upload avatar
- upload post image
- upload chat file
- upload workspace icon
- ลบไฟล์เก่า
- ensure bucket ตอนระบบเริ่มทำงาน

### ความสำคัญ
- รวม logic storage ไว้ที่เดียว ไม่ให้กระจายหลายโมดูล

---

## 6. Request Flow ของ Backend

ภาพรวมการไหลของ request ส่วนใหญ่จะเป็นแบบนี้

1. Client ส่ง request เข้ามาที่ route
2. Route เรียก middleware ที่จำเป็น เช่น auth, validate, upload
3. Route ส่งข้อมูลไป service
4. Service ทำ business logic และเรียก repository หรือ utility
5. Repository query database ผ่าน Prisma
6. Service ส่งผลลัพธ์กลับ route
7. Route ส่ง response กลับ client
8. ถ้าเกิด error จะถูกส่งไปจัดการที่ error handler

### ตัวอย่างเชิงแนวคิด
- Login:
  route รับ body -> validate -> service ตรวจ user -> utility เปรียบเทียบ password -> utility สร้าง JWT -> ส่ง cookie กลับ
- Send message:
  route/gateway รับ event -> service ตรวจสิทธิ์ -> repository บันทึก message -> gateway emit real-time -> อาจยิง push notification เพิ่ม

---

## 7. Real-time Flow

นอกจาก REST API แล้ว backend นี้ยังมี real-time flow ผ่าน Socket.IO

### ลำดับคร่าว ๆ
1. client connect socket
2. gateway ตรวจ token
3. client join room หรือ join DM
4. เมื่อมี event เช่นส่งข้อความ ระบบเรียก service ที่เกี่ยวข้อง
5. บันทึกข้อมูลลง database
6. emit event กลับไปยัง room/user ที่เกี่ยวข้อง

### ใช้กับอะไรบ้าง
- room chat
- DM
- typing indicator
- online status
- call signaling
- บาง notification แบบ in-app

---

## 8. สรุปภาพรวมแบบสั้นมาก

- `index.ts` ประกอบระบบทั้งหมด
- `middlewares/` กรองและจัดการ request
- `modules/` คือ business feature หลัก
- `types/` คือ type และ error กลาง
- `utils/` คือ helper ที่ใช้ร่วมกัน
- `chat.gateway.ts` ทำให้ระบบรองรับ real-time

### สรุปสั้นที่สุด
Backend ของ Tamely แยกตาม feature และแยกชั้นงานชัดเจน ทำให้ดูแล API, database logic, validation, auth และ real-time communication ได้เป็นระบบ

