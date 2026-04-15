# AI Chat Module — Implementation Spec
> Tamely Project | วันที่เขียน: 2026-04-15  
> ใช้เป็น spec สำหรับ implement ระบบ AI Chat ที่ครบทั้ง Backend และ Frontend

---

## 1. ภาพรวมระบบ

### สิ่งที่ AI ทำได้
1. **คุยทั่วไป** — ถามอะไรก็ได้ AI ตอบจากความรู้ทั่วไป
2. **Query ข้อมูล workspace** — ดึง task / ข้อความในห้องแล้วสรุปหรือตอบ
3. **สร้าง task** — AI สร้าง task ลงปฏิทินให้ได้จากการสนทนา

### หลักการออกแบบ
- ใช้ **OpenAI Function Calling** — AI ตัดสินใจเองว่าจะเรียก tool ไหน
- **Access Control** — AI เข้าถึงได้เฉพาะข้อมูลที่ user คนนั้นมีสิทธิ์เข้าถึงจริงๆ
- **Chunked Summarization** — รองรับข้อความเยอะโดยไม่พัง token limit
- **AiSummary Cache** — ถ้าขอสรุปห้องเดิมวันเดิม ไม่ต้องเรียก OpenAI ซ้ำ
- **Conversation History** — เก็บใน Frontend state ส่งแค่ 10 ข้อความล่าสุดต่อ request

---

## 2. Backend — `src/modules/ai/`

### โครงสร้างไฟล์ (ตาม pattern ของโปรเจกต์)
```
src/modules/ai/
├── ai.model.ts        ← Zod schemas (validate request body)
├── ai.repository.ts   ← Prisma queries (tasks, messages, rooms, cache)
├── ai.service.ts      ← OpenAI call + function calling loop + chunking
└── ai.routes.ts       ← Express router (1 endpoint)
```

### Mount ใน `src/index.ts`
เพิ่มบรรทัดนี้ในส่วน Routes (ก่อน errorHandler):
```ts
import aiRoutes from './modules/ai/ai.routes';
// ...
app.use('/api', aiRoutes);
```

---

## 3. API Endpoint

### `POST /api/workspaces/:wsId/ai/chat`

**Auth:** ต้องผ่าน `authenticate` middleware (JWT cookie)

**Request Body:**
```ts
{
  message: string;           // ข้อความล่าสุดจาก user (required)
  history?: {                // ประวัติการสนทนา (ส่งมาจาก Frontend state)
    role: 'user' | 'assistant';
    content: string;
  }[];                       // ส่งแค่ 10 ข้อความล่าสุด, default = []
}
```

**Response (Success 200):**
```ts
{
  success: true,
  data: {
    reply: string;           // ข้อความตอบจาก AI
    toolsUsed: string[];     // เช่น ["get_tasks", "create_task"] หรือ []
    taskCreated?: {          // มีเฉพาะเมื่อ AI เรียก create_task สำเร็จ
      id: string;
      title: string;
      date: string;          // ISO string
      priority: string;
    }
  }
}
```

**Response (Error):**
```ts
{ success: false, message: string }
// 403 — ไม่ใช่ member ของ workspace
// 400 — message เป็น empty string
// 500 — OpenAI error
```

---

## 4. `ai.model.ts` — Zod Schemas

```ts
import { z } from 'zod';

export const HistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const AiChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
  history: z.array(HistoryItemSchema).max(10).default([]),
});

export type TypeAiChatPayload = z.infer<typeof AiChatSchema>;
export type TypeHistoryItem = z.infer<typeof HistoryItemSchema>;
```

---

## 5. `ai.repository.ts` — Prisma Queries

ไฟล์นี้ทำหน้าที่ query ข้อมูลจาก DB ให้ service เรียกใช้

```ts
import { prisma } from '../../index';
import { TaskCreator, TaskPriority, TaskStatus } from '@prisma/client';

/* ======================= WORKSPACE MEMBER ======================= */

// ตรวจว่า user เป็นสมาชิก workspace ไหม + ดึง role
export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
};

/* ======================= ROOM ACCESS ======================= */

// ตรวจว่า user มีสิทธิ์เข้าถึงห้องนี้ไหม
// OWNER และ ADMIN ของ workspace เข้าได้ทุกห้อง
// MODERATOR / MEMBER ต้องเป็น RoomMember
export const canUserAccessRoom = async (
  roomId: string,
  userId: string,
  workspaceId: string,
): Promise<boolean> => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) return false;
  if (member.role === 'OWNER' || member.role === 'ADMIN') return true;

  const roomMember = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  return !!roomMember;
};

// ดึงรายการห้องที่ user เข้าถึงได้ใน workspace (สำหรับบอก AI ว่ามีห้องอะไรบ้าง)
export const getAccessibleRooms = async (workspaceId: string, userId: string) => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) return [];

  const isAdminOrOwner = member.role === 'OWNER' || member.role === 'ADMIN';

  return prisma.room.findMany({
    where: {
      workspaceId,
      isActive: true,
      ...(isAdminOrOwner ? {} : { members: { some: { userId } } }),
    },
    select: { id: true, name: true },
  });
};

/* ======================= TASKS ======================= */

// ดึง tasks ของ workspace กรองตามวันที่ได้
export const getTasks = async (
  workspaceId: string,
  filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  },
) => {
  const where: Record<string, unknown> = { workspaceId };
  if (filters.startDate || filters.endDate) {
    where.date = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    };
  }
  if (filters.status) where.status = filters.status;

  return prisma.task.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      priority: true,
      status: true,
      assignee: { select: { id: true, Name: true } },
    },
    orderBy: { date: 'asc' },
    take: 50, // จำกัดไม่เกิน 50 records
  });
};

// สร้าง task ใหม่ (AI เป็นผู้สร้าง)
export const createTask = async (
  workspaceId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    date: Date;
    priority: TaskPriority;
    assigneeId?: string;
  },
) => {
  return prisma.task.create({
    data: {
      workspaceId,
      title: data.title,
      description: data.description,
      date: data.date,
      priority: data.priority,
      status: TaskStatus.TODO,
      assigneeId: data.assigneeId ?? userId, // ถ้าไม่ระบุ assign ให้ตัวเอง
      createdById: userId,
      createdBy: TaskCreator.AI, // ← บอกว่า AI เป็นผู้สร้าง
    },
    select: {
      id: true,
      title: true,
      date: true,
      priority: true,
      status: true,
    },
  });
};

/* ======================= MESSAGES ======================= */

// นับจำนวนข้อความในช่วงเวลาของห้องนั้น
export const countMessages = async (
  roomId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<number> => {
  return prisma.message.count({
    where: {
      roomId,
      type: 'TEXT', // เอาแค่ text ไม่เอา SYSTEM/FILE
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    },
  });
};

// ดึงข้อความในห้อง — รองรับ pagination สำหรับ chunking
export const getMessages = async (
  roomId: string,
  options: {
    limit: number;
    offset: number;
    startDate?: Date;
    endDate?: Date;
  },
) => {
  return prisma.message.findMany({
    where: {
      roomId,
      type: 'TEXT',
      ...(options.startDate || options.endDate
        ? {
            createdAt: {
              ...(options.startDate ? { gte: options.startDate } : {}),
              ...(options.endDate ? { lte: options.endDate } : {}),
            },
          }
        : {}),
    },
    select: {
      content: true,
      createdAt: true,
      sender: { select: { Name: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: options.limit,
    skip: options.offset,
  });
};

// ดึงชื่อห้องจาก roomId
export const getRoomById = async (roomId: string) => {
  return prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, name: true, workspaceId: true },
  });
};

/* ======================= AI SUMMARY CACHE ======================= */

// ตรวจ cache ว่ามี summary ของห้องนี้ในวันนี้ไหม
export const findSummaryCache = async (
  roomId: string,
  periodStart: Date,
  periodEnd: Date,
) => {
  return prisma.aiSummary.findFirst({
    where: {
      roomId,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// บันทึก summary ใหม่เข้า cache
export const saveSummaryCache = async (data: {
  workspaceId: string;
  roomId: string;
  requestedById: string;
  periodStart: Date;
  periodEnd: Date;
  summaryText: string;
}) => {
  return prisma.aiSummary.create({ data });
};

/* ======================= AI QUERY LOG ======================= */

// บันทึก log การถาม-ตอบ AI
export const logAiQuery = async (data: {
  workspaceId: string;
  userId: string;
  question: string;
  answer: string;
  tokensUsed?: number;
}) => {
  return prisma.aiQuery.create({ data });
};
```

---

## 6. `ai.service.ts` — Business Logic + OpenAI

### Tool Definitions (ส่งให้ OpenAI)

AI มี 3 tools:

#### Tool 1: `get_tasks`
```json
{
  "type": "function",
  "function": {
    "name": "get_tasks",
    "description": "ดึงรายการ task งานของ workspace กรองตามช่วงวันที่หรือสถานะได้ ใช้เมื่อ user ถามเกี่ยวกับงาน task ปฏิทิน หรือสิ่งที่ต้องทำ",
    "parameters": {
      "type": "object",
      "properties": {
        "date_filter": {
          "type": "string",
          "enum": ["today", "tomorrow", "this_week", "next_week", "all"],
          "description": "ช่วงเวลาที่ต้องการดู default = today"
        },
        "status": {
          "type": "string",
          "enum": ["TODO", "IN_PROGRESS", "COMPLETED", "all"],
          "description": "กรองตามสถานะ default = all"
        }
      },
      "required": []
    }
  }
}
```

#### Tool 2: `create_task`
```json
{
  "type": "function",
  "function": {
    "name": "create_task",
    "description": "สร้าง task งานใหม่ในปฏิทินของ workspace ใช้เมื่อ user ขอให้สร้างหรือลงตาราง task งาน",
    "parameters": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "ชื่อ task งาน (ภาษาไทยหรืออังกฤษก็ได้)"
        },
        "date": {
          "type": "string",
          "description": "วันที่ของ task ในรูปแบบ YYYY-MM-DD"
        },
        "priority": {
          "type": "string",
          "enum": ["HIGH", "MEDIUM", "LOW"],
          "description": "ความสำคัญของ task default = MEDIUM"
        },
        "description": {
          "type": "string",
          "description": "รายละเอียดเพิ่มเติม (optional)"
        }
      },
      "required": ["title", "date"]
    }
  }
}
```

#### Tool 3: `get_room_messages`
```json
{
  "type": "function",
  "function": {
    "name": "get_room_messages",
    "description": "ดึงข้อความในห้องแชทเพื่อสรุปหรือวิเคราะห์ ใช้เมื่อ user ขอให้สรุปการสนทนาในห้อง ต้องระบุ room_id เสมอ",
    "parameters": {
      "type": "object",
      "properties": {
        "room_id": {
          "type": "string",
          "description": "UUID ของห้องที่ต้องการดึงข้อความ"
        },
        "date_filter": {
          "type": "string",
          "enum": ["today", "yesterday", "this_week", "last_3_days"],
          "description": "ช่วงเวลาที่ต้องการสรุป default = today"
        }
      },
      "required": ["room_id"]
    }
  }
}
```

---

### System Prompt

```
คุณคือ AI Assistant ของ Tamely ซึ่งเป็นแอปพลิเคชัน Team Collaboration
วันที่วันนี้คือ: {TODAY_DATE}
Workspace ที่ user อยู่: {WORKSPACE_NAME}
ห้องที่ user เข้าถึงได้: {ACCESSIBLE_ROOMS_LIST}

กฎการตอบ:
- ตอบเป็นภาษาไทยเสมอ
- ถ้าถามเรื่อง task หรือการสรุปการสนทนา ให้เรียก tool ก่อนตอบ
- ถ้าถามทั่วไป ตอบตรงๆ ไม่ต้องเรียก tool
- ถ้าต้องสรุปการสนทนาแต่ user ไม่บอกชื่อห้อง ให้ถามกลับว่าต้องการสรุปห้องไหน
- ถ้า user บอกชื่อห้องให้ match กับรายการ accessible rooms แล้วใช้ room_id ที่ถูกต้อง
- ถ้า user ขอดูห้องที่ไม่มีสิทธิ์ ให้บอกว่า "คุณไม่มีสิทธิ์เข้าถึงห้องนั้นครับ"
- ห้ามสร้าง task โดยไม่ได้รับการยืนยันจาก user ก่อน (ยกเว้น user สั่งตรงๆ เช่น "ช่วยสร้าง task..." หรือ "ลงตาราง...")
- เมื่อสร้าง task สำเร็จ ให้แจ้งผลลัพธ์พร้อมรายละเอียด task ที่สร้าง
```

---

### Logic Flow ใน `ai.service.ts`

```ts
export const processAiChat = async (params: {
  workspaceId: string;
  userId: string;
  message: string;
  history: TypeHistoryItem[];
}): Promise<{ reply: string; toolsUsed: string[]; taskCreated?: object; tokensUsed: number }> => {

  // 1. ตรวจสิทธิ์ user ใน workspace
  const member = await repository.findWorkspaceMember(params.workspaceId, params.userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  // 2. ดึงข้อมูลสำหรับ system prompt
  const workspace = await prisma.workspace.findUnique({ where: { id: params.workspaceId }, select: { name: true } });
  const accessibleRooms = await repository.getAccessibleRooms(params.workspaceId, params.userId);
  const roomListText = accessibleRooms.map(r => `- ${r.name} (id: ${r.id})`).join('\n');

  // 3. สร้าง messages array สำหรับ OpenAI
  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const systemPrompt = buildSystemPrompt(today, workspace?.name ?? '', roomListText);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...params.history.slice(-10),  // ส่ง history แค่ 10 ล่าสุด
    { role: 'user', content: params.message },
  ];

  // 4. เรียก OpenAI (Function Calling loop)
  const toolsUsed: string[] = [];
  let taskCreated: object | undefined;
  let totalTokens = 0;
  let finalReply = '';

  // OpenAI อาจเรียก tool หลายรอบ (loop จนกว่าจะได้ reply จริง)
  let currentMessages = messages;
  while (true) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',  // ใช้ gpt-4o-mini เพราะประหยัดและเร็ว
      messages: currentMessages as any,
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto',
      max_tokens: 1500,
    });

    totalTokens += response.usage?.total_tokens ?? 0;
    const choice = response.choices[0];

    // ถ้า OpenAI ตอบตรงๆ (ไม่เรียก tool)
    if (choice.finish_reason === 'stop') {
      finalReply = choice.message.content ?? '';
      break;
    }

    // ถ้า OpenAI เรียก tool
    if (choice.finish_reason === 'tool_calls') {
      const toolCalls = choice.message.tool_calls ?? [];
      const toolResults = [];

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        toolsUsed.push(toolName);

        let toolResult = '';

        if (toolName === 'get_tasks') {
          toolResult = await executeGetTasks(params.workspaceId, toolArgs);

        } else if (toolName === 'create_task') {
          const result = await executeCreateTask(params.workspaceId, params.userId, toolArgs);
          taskCreated = result.task;
          toolResult = result.message;

        } else if (toolName === 'get_room_messages') {
          // ตรวจสิทธิ์การเข้าถึงห้องก่อน
          const canAccess = await repository.canUserAccessRoom(
            toolArgs.room_id, params.userId, params.workspaceId,
          );
          if (!canAccess) {
            toolResult = 'ERROR: ผู้ใช้ไม่มีสิทธิ์เข้าถึงห้องนี้';
          } else {
            toolResult = await executeGetRoomMessages(
              params.workspaceId, params.userId, toolArgs,
            );
          }
        }

        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }

      // ต่อ loop ด้วย tool results
      currentMessages = [
        ...currentMessages,
        choice.message,
        ...toolResults,
      ] as any;
    }
  }

  // 5. Log ใน AiQuery
  await repository.logAiQuery({
    workspaceId: params.workspaceId,
    userId: params.userId,
    question: params.message,
    answer: finalReply,
    tokensUsed: totalTokens,
  });

  return { reply: finalReply, toolsUsed, taskCreated, tokensUsed: totalTokens };
};
```

---

### executeGetTasks — Helper

```ts
const executeGetTasks = async (workspaceId: string, args: { date_filter?: string; status?: string }): Promise<string> => {
  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  switch (args.date_filter ?? 'today') {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'tomorrow':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59);
      break;
    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59);
      break;
    }
    case 'next_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? 1 : 8);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59);
      break;
    }
    case 'all':
    default:
      break;
  }

  const tasks = await repository.getTasks(workspaceId, {
    startDate,
    endDate,
    status: args.status === 'all' ? undefined : args.status,
  });

  if (tasks.length === 0) return 'ไม่พบ task ในช่วงเวลาที่ระบุ';

  return tasks.map(t =>
    `- [${t.status}] ${t.title} | วันที่: ${new Date(t.date).toLocaleDateString('th-TH')} | Priority: ${t.priority} | Assignee: ${t.assignee?.Name ?? 'ไม่ได้กำหนด'}`
  ).join('\n');
};
```

---

### executeCreateTask — Helper

```ts
const executeCreateTask = async (
  workspaceId: string,
  userId: string,
  args: { title: string; date: string; priority?: string; description?: string },
): Promise<{ task: object; message: string }> => {
  const date = new Date(args.date);
  if (isNaN(date.getTime())) throw new AppError(400, 'Invalid date from AI');

  const task = await repository.createTask(workspaceId, userId, {
    title: args.title,
    description: args.description,
    date,
    priority: (args.priority ?? 'MEDIUM') as TaskPriority,
  });

  return {
    task,
    message: `สร้าง task "${task.title}" วันที่ ${new Date(task.date).toLocaleDateString('th-TH')} สำเร็จแล้ว`,
  };
};
```

---

### executeGetRoomMessages — Helper + Chunking Logic

```ts
const CHUNK_SIZE = 50;
const MAX_MESSAGES = 1000;

const executeGetRoomMessages = async (
  workspaceId: string,
  userId: string,
  args: { room_id: string; date_filter?: string },
): Promise<string> => {
  const room = await repository.getRoomById(args.room_id);
  if (!room) return 'ERROR: ไม่พบห้องนี้';
  if (room.workspaceId !== workspaceId) return 'ERROR: ห้องนี้ไม่ใช่ของ workspace นี้';

  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (args.date_filter ?? 'today') {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      break;
    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      break;
    case 'last_3_days':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0);
      break;
    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
      break;
    }
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  }

  // นับจำนวนก่อน
  const totalCount = await repository.countMessages(args.room_id, startDate, endDate);

  if (totalCount === 0) return `ไม่มีข้อความในห้อง "${room.name}" ช่วงเวลาที่ระบุ`;

  if (totalCount > MAX_MESSAGES) {
    return `ข้อความในห้อง "${room.name}" มีมากเกินไป (${totalCount} ข้อความ) กรุณาระบุช่วงเวลาที่แคบกว่านี้ เช่น "สรุปวันนี้" หรือ "สรุปเมื่อวาน"`;
  }

  // ดึงข้อความแบบ chunk
  const chunks: string[] = [];
  let offset = 0;
  while (offset < totalCount) {
    const messages = await repository.getMessages(args.room_id, {
      limit: CHUNK_SIZE,
      offset,
      startDate,
      endDate,
    });
    if (messages.length === 0) break;

    const chunkText = messages.map(m =>
      `[${new Date(m.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}] ${m.sender.Name}: ${m.content}`
    ).join('\n');
    chunks.push(chunkText);
    offset += messages.length;
  }

  // ถ้าข้อความน้อย ส่งตรง
  if (chunks.length === 1) {
    return `ข้อความในห้อง "${room.name}":\n${chunks[0]}`;
  }

  // ถ้าข้อความเยอะ → Chunked Map-Reduce Summarization
  // สรุปแต่ละ chunk ก่อน (parallel)
  const summaryPromises = chunks.map(chunk =>
    openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'สรุปการสนทนาในห้อง chat นี้เป็นภาษาไทย ให้กระชับ เน้น key points สำคัญ' },
        { role: 'user', content: chunk },
      ],
      max_tokens: 400,
    })
  );

  const summaryResponses = await Promise.all(summaryPromises);
  const miniSummaries = summaryResponses.map((r, i) =>
    `[ส่วนที่ ${i + 1}] ${r.choices[0].message.content ?? ''}`
  ).join('\n\n');

  // รวม mini-summaries → สรุปรวมสุดท้าย
  const finalSummaryResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'นี่คือสรุปการสนทนาแบ่งเป็นช่วงๆ กรุณารวมและสรุปเป็นภาษาไทยที่เชื่อมกันสมบูรณ์' },
      { role: 'user', content: miniSummaries },
    ],
    max_tokens: 600,
  });

  const finalSummary = finalSummaryResponse.choices[0].message.content ?? '';

  // บันทึก cache
  await repository.saveSummaryCache({
    workspaceId,
    roomId: args.room_id,
    requestedById: userId,
    periodStart: startDate,
    periodEnd: endDate,
    summaryText: finalSummary,
  });

  return finalSummary;
};
```

---

## 7. `ai.routes.ts` — Express Router

```ts
import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AuthRequest } from '../../types';
import { AiChatSchema } from './ai.model';
import * as aiService from './ai.service';

const router = Router();
router.use(authenticate);

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

// POST /api/workspaces/:wsId/ai/chat
router.post(
  '/workspaces/:wsId/ai/chat',
  validateRequest(AiChatSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await aiService.processAiChat({
      workspaceId: param(req.params.wsId),
      userId: req.userId!,
      message: req.body.message,
      history: req.body.history ?? [],
    });

    res.json({ success: true, data: result });
  }),
);

export default router;
```

---

## 8. Frontend — แก้ `src/features/ai-chat/index.tsx`

### สิ่งที่ต้องเปลี่ยน
ไฟล์เดิมที่ `Frontend_Web/src/features/ai-chat/index.tsx` มี mock ทั้งหมด ต้องแทนที่ด้วย real API call

### State ที่ต้องเพิ่ม
```ts
// เพิ่ม import
import { useWorkspace } from '@/hooks/useWorkspace';
import api from '@/services/api';  // axios instance

// เพิ่ม state
const { currentWorkspace } = useWorkspace();

// conversation history สำหรับ multi-turn (เก็บใน state ไม่ใช่ DB)
const [conversationHistory, setConversationHistory] = useState<
  { role: 'user' | 'assistant'; content: string }[]
>([]);
```

### แทนที่ `handleSend` function
```ts
const handleSend = async () => {
  if (!input.trim() || !currentWorkspace) return;

  const userMessage: AIMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: input,
    timestamp: new Date(),
  };

  setMessages((prev) => [...prev, userMessage]);
  const currentInput = input;
  setInput('');
  setIsTyping(true);

  try {
    const response = await api.post(
      `/workspaces/${currentWorkspace.id}/ai/chat`,
      {
        message: currentInput,
        history: conversationHistory.slice(-10), // ส่งแค่ 10 ล่าสุด
      }
    );

    const { reply, taskCreated } = response.data.data;

    const aiMessage: AIMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);

    // อัพเดท conversation history
    setConversationHistory((prev) => [
      ...prev,
      { role: 'user', content: currentInput },
      { role: 'assistant', content: reply },
    ]);

    // ถ้า AI สร้าง task ได้ แสดง toast แจ้ง
    if (taskCreated) {
      // import { toast } from 'sonner' แล้วใช้
      toast.success('สร้าง task สำเร็จ!', {
        description: `Task "${(taskCreated as any).title}" ถูกเพิ่มในปฏิทินแล้ว`,
      });
    }
  } catch (error: any) {
    const errorMessage: AIMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'ขออภัยครับ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsTyping(false);
  }
};
```

---

## 9. Access Control Summary

| Action | ตรวจสิทธิ์ |
|--------|-----------|
| เรียก endpoint `/ai/chat` | user ต้องเป็น member ของ workspaceId ที่ระบุ |
| `get_tasks` | scoped ตาม workspaceId อัตโนมัติ (ไม่ต้องเช็คเพิ่ม) |
| `create_task` | ต้องเป็น member (เช็คแล้วที่ endpoint level) |
| `get_room_messages` | OWNER/ADMIN เข้าได้ทุกห้อง, MODERATOR/MEMBER ต้องเป็น RoomMember |

---

## 10. Chunking Decision Table

| จำนวนข้อความ | วิธีการ |
|---|---|
| 0 | แจ้งว่าไม่มีข้อความ |
| 1–50 | ส่ง OpenAI ตรงๆ ครั้งเดียว |
| 51–1000 | Chunked Map-Reduce (ทีละ 50, parallel) แล้ว final summary |
| > 1000 | ปฏิเสธ บอก user ให้ระบุช่วงเวลาที่แคบกว่า |

---

## 11. AiSummary Cache Policy

Cache จะถูกใช้เมื่อ:
- `roomId` ตรงกัน
- `periodStart` และ `periodEnd` อยู่ในช่วงเดียวกัน

> หมายเหตุ: ปัจจุบัน cache check ยังไม่ถูก implement ใน flow หลัก ให้เพิ่มใน `executeGetRoomMessages` ก่อน call OpenAI ดังนี้:

```ts
// ตรวจ cache ก่อน
const cached = await repository.findSummaryCache(args.room_id, startDate, endDate);
if (cached) return `(จาก cache) ${cached.summaryText}`;
```

---

## 12. Dependencies ที่ต้องมี

### Backend
```bash
# openai SDK ติดตั้งแล้ว ตรวจสอบใน package.json
# ถ้ายังไม่มี:
npm install openai
```

### Environment Variable ที่ต้องมี
```env
OPENAI_API_KEY=sk-...   # มีอยู่แล้วใน .env
```

### Frontend
```bash
# ไม่มี dependency ใหม่
# ใช้ api instance จาก src/services/api.ts ที่มีอยู่แล้ว
# ใช้ toast จาก sonner ที่มีอยู่แล้ว
```

---

## 13. ไฟล์ที่ต้องสร้าง / แก้ไข

| ไฟล์ | action |
|------|--------|
| `Backend/prisma-api/src/modules/ai/ai.model.ts` | สร้างใหม่ |
| `Backend/prisma-api/src/modules/ai/ai.repository.ts` | สร้างใหม่ |
| `Backend/prisma-api/src/modules/ai/ai.service.ts` | สร้างใหม่ |
| `Backend/prisma-api/src/modules/ai/ai.routes.ts` | สร้างใหม่ |
| `Backend/prisma-api/src/index.ts` | เพิ่ม import + mount route |
| `Frontend_Web/src/features/ai-chat/index.tsx` | แทน mock ด้วย real API call |

---

## 14. หมายเหตุสำคัญ

1. **OpenAI model** ใช้ `gpt-4o-mini` เพราะเร็วและถูกกว่า `gpt-4o` เหมาะกับ semester project
2. **Error handler** ใน `src/index.ts` ต้องอยู่ท้ายสุดเสมอ (มีอยู่แล้ว ไม่ต้องย้าย)
3. **asyncHandler** ต้อง wrap ทุก async route handler (ตาม pattern เดิมของโปรเจกต์)
4. **Prisma import** ใช้ `import { prisma } from '../../index'` (ตาม pattern เดิม)
5. **AppError** ใช้ `import { AppError } from '../../types'` (ตาม pattern เดิม)
6. **TypeScript strict** — ระวัง `as any` ใน OpenAI messages array เนื่องจาก tool result type
7. **Conversation history** — เก็บใน React state เท่านั้น ไม่เก็บใน DB (performance)
8. **AiQuery log** — บันทึกทุก request แต่ไม่อ่านกลับมาใช้ (เป็น log เท่านั้น)
