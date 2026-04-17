# DB Models Guide — Tamely

เอกสารนี้สรุปโครงสร้างฐานข้อมูลของโปรเจกต์ Tamely จากไฟล์ `Backend/prisma-api/prisma/schema.prisma`

ใช้สำหรับ 2 แบบ:
- อ่านเร็วเพื่อจำว่าแต่ละ model ทำหน้าที่อะไร
- อ่านละเอียดเพื่อเข้าใจว่าแต่ละ field เก็บข้อมูลรูปแบบไหน และเอาไปใช้ทำอะไร

---

## ส่วนที่ 1: สรุปเร็วว่าแต่ละ Model ทำหน้าที่อะไร

### กลุ่มผู้ใช้และสิทธิ์

| Model | หน้าที่หลัก | เก็บอะไร |
|---|---|---|
| `User` | เก็บข้อมูลผู้ใช้ | email, password, ชื่อ, รูป, OAuth, สถานะผู้ใช้ |
| `Workspace` | เก็บข้อมูลทีม/พื้นที่ทำงาน | ชื่อทีม, owner, invite code, icon, description |
| `WorkspaceMember` | บอกว่าใครอยู่ workspace ไหน | ความสัมพันธ์ user-workspace และ role หลัก |
| `CustomRole` | เก็บ role แบบกำหนดเอง | ชื่อ role, สี, ลำดับ, permission list |
| `CustomRoleMember` | บอกว่าใครถือ custom role อะไร | ความสัมพันธ์ user-custom role ใน workspace |

### กลุ่มแชทและการสื่อสาร

| Model | หน้าที่หลัก | เก็บอะไร |
|---|---|---|
| `Room` | เก็บข้อมูลห้องแชทใน workspace | ชื่อห้อง, private/public, allowed roles |
| `RoomMember` | บอกว่าใครอยู่ห้องไหน | สมาชิกห้องและเวลาอ่านล่าสุด |
| `Message` | เก็บข้อความในห้อง | ข้อความ, ไฟล์, รูป, ผู้ส่ง, เวลา |
| `DirectConversation` | เก็บคู่สนทนา DM | user A, user B, workspace ที่คุยกัน |
| `DirectMessage` | เก็บข้อความใน DM | ข้อความ, ไฟล์, ผู้ส่ง, สถานะอ่านแล้ว |
| `CallLog` | เก็บประวัติการโทร | audio/video, caller, receiver, duration, status |

### กลุ่ม feed และงาน

| Model | หน้าที่หลัก | เก็บอะไร |
|---|---|---|
| `Post` | เก็บโพสต์/ประกาศ | title, body, รูป, pinned |
| `PostComment` | เก็บคอมเมนต์ใต้โพสต์ | เนื้อหาคอมเมนต์, คนคอมเมนต์ |
| `Task` | เก็บงานและปฏิทิน | ชื่องาน, วันเวลา, priority, status, assignee |

### กลุ่ม AI และการแจ้งเตือน

| Model | หน้าที่หลัก | เก็บอะไร |
|---|---|---|
| `AiSummary` | เก็บผลสรุปที่ AI สร้าง | ช่วงเวลา, ข้อความสรุป, คนขอสรุป |
| `AiSession` | เก็บ session ของการคุยกับ AI | ชื่อ session, owner, pin status |
| `AiQuery` | เก็บ log คำถาม-คำตอบ AI | question, answer, token usage |
| `Notification` | เก็บการแจ้งเตือน | ผู้รับ, ผู้ส่ง, ประเภท mention, post/comment ที่เกี่ยวข้อง |

---

## ส่วนที่ 2: รายละเอียดแต่ละ Model

## 1. `User`

### หน้าที่
เก็บข้อมูลผู้ใช้หลักของระบบ ทั้งข้อมูลสำหรับ login, profile, OAuth และความสัมพันธ์กับทุก feature ที่ user ใช้งาน

### ฟิลด์สำคัญ
- `id: String @db.Uuid`
  รหัสผู้ใช้แบบ UUID ใช้เป็น primary key
- `email: String`
  อีเมลสำหรับเข้าสู่ระบบ ต้องไม่ซ้ำ
- `passwordHash: String?`
  รหัสผ่านที่ hash แล้ว ถ้า login ผ่าน OAuth อาจเป็น `null`
- `Name: String`
  ชื่อที่ใช้แสดงในระบบ
- `avatarUrl: String?`
  URL รูปโปรไฟล์
- `bio: String?`
  ข้อมูลแนะนำตัว
- `pushToken: String?`
  token สำหรับส่ง push notification
- `status: String`
  สถานะผู้ใช้ เช่น `active`, `inactive`, `banned`
- `lastSeenAt: DateTime?`
  เวลาที่ออนไลน์ล่าสุด
- `provider: String?`
  ผู้ให้บริการ OAuth เช่น `google`, `github`
- `providerId: String?`
  id ที่มาจาก OAuth provider
- `createdAt`, `updatedAt: DateTime`
  เวลาเริ่มสร้างและเวลาแก้ไขล่าสุด

### ใช้เก็บอะไร
- ตัวตนของผู้ใช้ในระบบ
- ข้อมูลสำหรับ auth และ profile
- จุดเชื่อมไปยัง workspace, room, message, post, task, AI, notification และ DM

### ความสัมพันธ์หลัก
- 1 user เป็นเจ้าของ workspace ได้หลายอัน
- 1 user เป็นสมาชิกหลาย workspace และหลาย room ได้
- 1 user ส่ง message, post, comment, task, notification ได้หลายรายการ

---

## 2. `Workspace`

### หน้าที่
เป็นหน่วยหลักของระบบ เปรียบเหมือนทีม, server หรือองค์กรย่อยที่รวมคน ห้องแชท โพสต์ งาน และ AI context ไว้ด้วยกัน

### ฟิลด์สำคัญ
- `id: String @db.Uuid`
  รหัส workspace
- `name: String`
  ชื่อ workspace
- `description: String?`
  คำอธิบายของทีม
- `iconUrl: String?`
  URL ไอคอน workspace
- `inviteCode: String`
  รหัสสำหรับชวนสมาชิกเข้าร่วม
- `ownerId: String @db.Uuid`
  อ้างถึง user ที่เป็นเจ้าของ workspace
- `isActive: Boolean`
  บอกว่า workspace ยังใช้งานอยู่หรือไม่
- `createdAt`, `updatedAt: DateTime`

### ใช้เก็บอะไร
- ข้อมูลระดับทีม
- context หลักของทุก feature เช่น chat, feed, task, AI, notification

### ความสัมพันธ์หลัก
- มีสมาชิกได้หลายคนผ่าน `WorkspaceMember`
- มี room, post, task, direct conversation, notification หลายรายการ

---

## 3. `WorkspaceMember`

### หน้าที่
เป็นตารางกลางเชื่อม `User` กับ `Workspace` และเก็บ role หลักของสมาชิกใน workspace

### ฟิลด์สำคัญ
- `workspaceId: String @db.Uuid`
  สมาชิกคนนี้อยู่ workspace ไหน
- `userId: String @db.Uuid`
  อ้างถึงผู้ใช้คนไหน
- `role: WorkspaceRole`
  สิทธิ์หลัก เช่น `OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`
- `joinedAt: DateTime`
  เวลาเข้าร่วม

### ใช้เก็บอะไร
- รายชื่อสมาชิกใน workspace
- บทบาทหลักของแต่ละคน
- ใช้ตรวจสิทธิ์การจัดการ workspace และ feature ต่าง ๆ

### รูปแบบข้อมูล
- 1 แถว = 1 คนใน 1 workspace
- มี `@@unique([workspaceId, userId])` เพื่อไม่ให้ user ซ้ำใน workspace เดียว

---

## 4. `CustomRole`

### หน้าที่
เก็บ role แบบกำหนดเองใน workspace นอกเหนือจาก role หลัก

### ฟิลด์สำคัญ
- `workspaceId: String @db.Uuid`
  role นี้อยู่ใน workspace ไหน
- `name: String`
  ชื่อ role
- `color: String`
  สีของ role เช่น hex color
- `position: Int`
  ลำดับการแสดงผลหรือการจัดเรียง
- `permissions: String[]`
  รายการ permission ที่ role นี้มี
- `createdAt`, `updatedAt: DateTime`

### ใช้เก็บอะไร
- role เสริม เช่น `Designer`, `QA`, `Project Lead`
- สิทธิ์แบบยืดหยุ่นที่ทีมกำหนดเอง

### รูปแบบข้อมูล
- `permissions` เป็น array ของ string
- 1 workspace มี role ชื่อเดิมซ้ำกันไม่ได้

---

## 5. `CustomRoleMember`

### หน้าที่
เชื่อมผู้ใช้กับ custom role

### ฟิลด์สำคัญ
- `workspaceId: String @db.Uuid`
  ใช้ระบุ context ของ workspace
- `customRoleId: String @db.Uuid`
  role ที่ได้รับ
- `userId: String @db.Uuid`
  ผู้ใช้ที่ได้รับ role
- `assignedAt: DateTime`
  เวลา assign

### ใช้เก็บอะไร
- ว่าใครได้รับ custom role อะไร
- ใช้ในระบบ permission และ mention role

### รูปแบบข้อมูล
- 1 แถว = 1 user ได้รับ 1 custom role
- ห้าม user ได้ role เดิมซ้ำด้วย `@@unique([customRoleId, userId])`

---

## 6. `Room`

### หน้าที่
เก็บข้อมูลห้องแชทใน workspace

### ฟิลด์สำคัญ
- `workspaceId: String @db.Uuid`
  ห้องนี้อยู่ใน workspace ไหน
- `name: String`
  ชื่อห้อง
- `description: String?`
  คำอธิบายห้อง
- `isPrivate: Boolean`
  ห้อง private หรือ public
- `allowedRoles: WorkspaceRole[]`
  role หลักที่เข้าห้องได้ ถ้าว่างหมายถึงทุก role เข้าได้
- `createdById: String @db.Uuid`
  คนสร้างห้อง
- `isActive: Boolean`
  สถานะห้อง
- `createdAt`, `updatedAt: DateTime`

### ใช้เก็บอะไร
- metadata ของ channel
- กติกาการเข้าถึงห้อง

### รูปแบบข้อมูล
- `allowedRoles` เป็น enum array
- ชื่อห้องซ้ำกันไม่ได้ใน workspace เดียว

---

## 7. `RoomMember`

### หน้าที่
เชื่อมผู้ใช้กับห้องแชท และใช้ติดตามสถานะการอ่าน

### ฟิลด์สำคัญ
- `roomId: String @db.Uuid`
  ห้องที่ user อยู่
- `userId: String @db.Uuid`
  สมาชิกในห้อง
- `joinedAt: DateTime`
  เวลาเข้าห้อง
- `lastReadAt: DateTime`
  อ่านถึงเวลาไหนล่าสุด

### ใช้เก็บอะไร
- สมาชิกของแต่ละ room
- จุดอ้างอิงสำหรับคำนวณ unread message

### รูปแบบข้อมูล
- 1 แถว = 1 คนใน 1 ห้อง
- ใช้ `lastReadAt` เทียบกับ `Message.createdAt` เพื่อหาข้อความที่ยังไม่อ่าน

---

## 8. `Message`

### หน้าที่
เก็บข้อความที่ส่งใน room chat

### ฟิลด์สำคัญ
- `roomId: String @db.Uuid`
  ข้อความนี้อยู่ห้องไหน
- `senderId: String @db.Uuid`
  ผู้ส่งข้อความ
- `type: MessageType`
  ประเภทข้อความ เช่น `TEXT`, `IMAGE`, `FILE`, `SYSTEM`
- `content: String`
  เนื้อหาข้อความ หรือ caption
- `fileUrl: String?`
  URL ของไฟล์แนบ
- `fileName: String?`
  ชื่อไฟล์เดิม
- `fileSize: Int?`
  ขนาดไฟล์เป็น bytes
- `createdAt: DateTime`
  เวลาส่ง

### ใช้เก็บอะไร
- ข้อความทุกชนิดใน room
- รองรับทั้งข้อความธรรมดาและไฟล์แนบ

### รูปแบบข้อมูล
- ถ้าเป็น `TEXT` มักใช้ `content` อย่างเดียว
- ถ้าเป็น `IMAGE` หรือ `FILE` มักมี `fileUrl`, `fileName`, `fileSize`
- ถ้าเป็น `SYSTEM` ใช้เก็บข้อความเชิงระบบ เช่น join/leave/call status

---

## 9. `DirectConversation`

### หน้าที่
เก็บคู่สนทนา DM แบบ 1 ต่อ 1

### ฟิลด์สำคัญ
- `workspaceId: String @db.Uuid`
  DM นี้อยู่ภายใต้ workspace ไหน
- `userAId: String @db.Uuid`
  คนแรกของคู่สนทนา
- `userBId: String @db.Uuid`
  คนที่สองของคู่สนทนา
- `createdAt`, `updatedAt: DateTime`

### ใช้เก็บอะไร
- ระบุตัวตนของห้อง DM
- ใช้เป็น parent ให้ `DirectMessage` และ `CallLog`

### รูปแบบข้อมูล
- 1 แถว = 1 คู่สนทนา
- มี unique key กันไม่ให้สร้างคู่เดิมซ้ำใน workspace เดียว

---

## 10. `DirectMessage`

### หน้าที่
เก็บข้อความใน DM

### ฟิลด์สำคัญ
- `conversationId: String @db.Uuid`
  ข้อความนี้อยู่ใน DM ไหน
- `senderId: String @db.Uuid`
  ใครเป็นคนส่ง
- `content: String`
  ข้อความหรือ caption
- `type: MessageType`
  ประเภทข้อความ
- `fileUrl: String?`
  URL ไฟล์แนบ
- `fileName: String?`
  ชื่อไฟล์
- `fileSize: Int?`
  ขนาดไฟล์
- `isRead: Boolean`
  อ่านแล้วหรือยัง
- `createdAt: DateTime`

### ใช้เก็บอะไร
- ข้อความส่วนตัวแบบ 1-1
- ใช้สร้าง unread badge ของ DM

### รูปแบบข้อมูล
- คล้าย `Message` แต่มี `isRead`
- ใช้ `conversationId` เป็นตัวรวมข้อความทั้งหมดของคู่สนทนา

---

## 11. `CallLog`

### หน้าที่
เก็บประวัติการโทรระหว่างผู้ใช้ 2 คนใน DM

### ฟิลด์สำคัญ
- `conversationId: String @db.Uuid`
  การโทรนี้อยู่ใน DM ไหน
- `callerId: String @db.Uuid`
  คนโทรออก
- `receiverId: String @db.Uuid`
  คนรับสาย
- `callType: CallType`
  ประเภทการโทร `AUDIO` หรือ `VIDEO`
- `status: CallStatus`
  สถานะเช่น `MISSED`, `REJECTED`, `ANSWERED`, `ENDED`
- `startedAt: DateTime`
  เวลาเริ่ม
- `endedAt: DateTime?`
  เวลาจบ
- `duration: Int?`
  ระยะเวลาเป็นวินาที

### ใช้เก็บอะไร
- ประวัติการโทร
- ใช้แสดง missed call, rejected call, ended call

### รูปแบบข้อมูล
- 1 แถว = 1 session การโทร
- ถ้าโทรไม่ติด `endedAt` และ `duration` อาจไม่มี

---

## 12. `Post`

### หน้าที่
เก็บโพสต์หรือประกาศใน feed ของ workspace

### ฟิลด์สำคัญ
- `workspaceId: String @db.Uuid`
  โพสต์อยู่ workspace ไหน
- `authorId: String @db.Uuid`
  คนเขียนโพสต์
- `title: String`
  หัวข้อโพสต์
- `body: String`
  เนื้อหาโพสต์
- `imageUrls: String[]`
  URL รูปภาพแนบหลายรูป
- `isPinned: Boolean`
  ปักหมุดหรือไม่
- `createdAt`, `updatedAt: DateTime`

### ใช้เก็บอะไร
- ข่าวสาร ประกาศ หรือเนื้อหา feed
- รองรับการแนบหลายรูป

### รูปแบบข้อมูล
- `imageUrls` เป็น array ของ string
- ใช้ `isPinned` แยกโพสต์สำคัญให้ขึ้นก่อน

---

## 13. `PostComment`

### หน้าที่
เก็บคอมเมนต์ของโพสต์

### ฟิลด์สำคัญ
- `postId: String @db.Uuid`
  คอมเมนต์นี้อยู่ใต้โพสต์ไหน
- `userId: String @db.Uuid`
  ใครเป็นคนคอมเมนต์
- `content: String`
  เนื้อหาคอมเมนต์
- `createdAt`, `updatedAt: DateTime`

### ใช้เก็บอะไร
- การตอบกลับใต้โพสต์
- ใช้ร่วมกับ notification เมื่อมีการ mention

### รูปแบบข้อมูล
- 1 แถว = 1 คอมเมนต์
- ผูกกับ `Post` แบบ many-to-one

---

## 14. `Task`

### หน้าที่
เก็บงานและข้อมูลที่ใช้แสดงบนปฏิทิน

### ฟิลด์สำคัญ
- `workspaceId: String @db.Uuid`
  งานนี้อยู่ workspace ไหน
- `title: String`
  ชื่องาน
- `description: String?`
  รายละเอียดงาน
- `date: DateTime`
  วันและเวลาของงาน
- `priority: TaskPriority`
  ระดับความสำคัญ `HIGH`, `MEDIUM`, `LOW`
- `status: TaskStatus`
  สถานะ `TODO`, `IN_PROGRESS`, `COMPLETED`
- `assigneeId: String @db.Uuid`
  มอบหมายให้ใคร
- `createdById: String @db.Uuid`
  ใครสร้างงาน
- `createdBy: TaskCreator`
  สร้างโดย `USER` หรือ `AI`
- `createdAt`, `updatedAt: DateTime`

### ใช้เก็บอะไร
- งานที่ต้องทำในทีม
- ตารางงานหรือ event ใน calendar
- แยกได้ว่างานนี้ AI สร้างหรือ user สร้าง

### รูปแบบข้อมูล
- ใช้ `date` สำหรับแสดงใน calendar
- ใช้ `status` และ `priority` สำหรับ filtering และ sorting

---

## 15. `AiSummary`

### หน้าที่
เก็บผลสรุปที่ AI สร้างจากข้อมูลการสนทนา

### ฟิลด์สำคัญ
- `workspaceId: String?`
  ถ้าสรุประดับ workspace จะใช้ field นี้
- `roomId: String?`
  ถ้าสรุประดับห้องจะแปะ room id
- `requestedById: String @db.Uuid`
  ใครเป็นคนขอสรุป
- `periodStart: DateTime`
  ช่วงเวลาที่เริ่มสรุป
- `periodEnd: DateTime`
  ช่วงเวลาที่สิ้นสุด
- `summaryText: String`
  ข้อความสรุปจาก AI
- `createdAt: DateTime`

### ใช้เก็บอะไร
- cache ของ summary เพื่อไม่ต้องสร้างใหม่ทุกครั้ง
- เก็บประวัติว่าใครเคยขอสรุปช่วงไหน

### รูปแบบข้อมูล
- `workspaceId` และ `roomId` เป็น nullable เพราะสรุปได้หลายระดับ
- 1 แถว = 1 summary ของช่วงเวลาหนึ่ง

---

## 16. `AiSession`

### หน้าที่
เก็บ metadata ของ session การคุยกับ AI

### ฟิลด์สำคัญ
- `id: String @db.Uuid`
  session id
- `workspaceId: String @db.Uuid`
  session นี้อยู่ workspace ไหน
- `userId: String @db.Uuid`
  เจ้าของ session
- `title: String`
  ชื่อ session
- `isPinned: Boolean`
  ปักหมุดไว้หรือไม่
- `createdAt`, `updatedAt: DateTime`

### ใช้เก็บอะไร
- รายการ session ของ AI chat
- ใช้แยกบทสนทนา AI เป็นหลายหัวข้อ

### รูปแบบข้อมูล
- มองได้เป็นหัวของ conversation
- เชิงตรรกะใช้เชื่อมกับ `AiQuery.sessionId`

---

## 17. `AiQuery`

### หน้าที่
เก็บคำถามและคำตอบแต่ละครั้งของ AI

### ฟิลด์สำคัญ
- `workspaceId: String @db.Uuid`
  คำถามนี้เกิดใน workspace ไหน
- `userId: String @db.Uuid`
  ใครเป็นคนถาม
- `sessionId: String?`
  อยู่ใน session ไหน
- `question: String`
  ข้อความที่ user ถาม
- `answer: String`
  ข้อความที่ AI ตอบ
- `tokensUsed: Int?`
  จำนวน token ที่ใช้
- `createdAt: DateTime`

### ใช้เก็บอะไร
- history การถามตอบ AI
- ติดตามต้นทุนการใช้ AI ผ่าน `tokensUsed`

### รูปแบบข้อมูล
- 1 แถว = 1 คำถาม-คำตอบ
- รองรับข้อมูลเก่าได้ด้วยการทำ `sessionId` เป็น nullable

---

## 18. `Notification`

### หน้าที่
เก็บการแจ้งเตือนในระบบ โดยเฉพาะกรณี mention ผู้ใช้หรือ role

### ฟิลด์สำคัญ
- `workspaceId: String @db.Uuid`
  การแจ้งเตือนเกิดใน workspace ไหน
- `userId: String @db.Uuid`
  คนที่ได้รับแจ้งเตือน
- `senderId: String @db.Uuid`
  คนที่เป็นต้นเหตุของ event
- `type: MentionTargetType`
  `USER` หรือ `ROLE`
- `targetRole: WorkspaceRole?`
  ถ้า mention role จะเก็บ role ตรงนี้
- `postId: String?`
  ถ้าแจ้งเตือนมาจากโพสต์ จะเก็บ post id
- `commentId: String?`
  ถ้าแจ้งเตือนมาจากคอมเมนต์ จะเก็บ comment id
- `content: String`
  ข้อความแจ้งเตือน
- `isRead: Boolean`
  อ่านแล้วหรือยัง
- `createdAt: DateTime`

### ใช้เก็บอะไร
- แจ้งเตือนเมื่อมีคน mention
- ใช้ทำ notification bell, unread count และ notification list

### รูปแบบข้อมูล
- 1 แถว = 1 notification ต่อ 1 ผู้รับ
- ถ้า mention หลายคน ระบบอาจสร้างหลายแถว
- `postId` และ `commentId` เป็น nullable เพราะบางแจ้งเตือนอาจมาจากโพสต์ บางอันมาจากคอมเมนต์

---

## หมายเหตุเรื่องชนิดข้อมูลที่เจอบ่อยใน schema

- `String @db.Uuid`
  เก็บเป็น UUID ใช้เป็น id หรือ foreign key
- `String?`
  เป็นข้อความที่ nullable ได้
- `DateTime`
  เก็บวันเวลา
- `Boolean`
  true/false
- `Int`
  ตัวเลขจำนวนเต็ม เช่น ขนาดไฟล์หรือ duration
- `String[]`
  array ของข้อความ เช่น `permissions`, `imageUrls`
- `Enum`
  ค่าที่เลือกได้เฉพาะชุด เช่น role, message type, task status

## Enums ที่ใช้ในระบบ

- `WorkspaceRole`: `OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`
- `MessageType`: `TEXT`, `IMAGE`, `FILE`, `SYSTEM`
- `TaskPriority`: `HIGH`, `MEDIUM`, `LOW`
- `TaskStatus`: `TODO`, `IN_PROGRESS`, `COMPLETED`
- `TaskCreator`: `USER`, `AI`
- `MentionTargetType`: `USER`, `ROLE`
- `CallType`: `AUDIO`, `VIDEO`
- `CallStatus`: `MISSED`, `REJECTED`, `ANSWERED`, `ENDED`

---

## สรุปภาพรวมแบบสั้นมาก

- `User` คือคน
- `Workspace` คือทีม
- `Room` และ `Message` คือแชทในทีม
- `DirectConversation` และ `DirectMessage` คือแชทส่วนตัว
- `Post` และ `PostComment` คือ feed/ประกาศ
- `Task` คือระบบงานและปฏิทิน
- `AiSummary`, `AiSession`, `AiQuery` คือส่วนของ AI
- `Notification` คือระบบแจ้งเตือน

