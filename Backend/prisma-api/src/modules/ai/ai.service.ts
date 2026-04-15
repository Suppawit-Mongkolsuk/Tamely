import OpenAI from 'openai';
import { TaskPriority } from '@prisma/client';
import { AppError } from '../../types';
import * as repository from './ai.repository';
import { TypeHistoryItem } from './ai.model';

const AI_MODEL = 'gpt-4o-mini';
const CHUNK_SIZE = 50;
const MAX_MESSAGES = 1000;
const MAX_TOOL_LOOPS = 6;

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_tasks',
      description:
        'ดึงรายการ task งานของ workspace กรองตามช่วงวันที่หรือสถานะได้ ใช้เมื่อ user ถามเกี่ยวกับงาน task ปฏิทิน หรือสิ่งที่ต้องทำ',
      parameters: {
        type: 'object',
        properties: {
          date_filter: {
            type: 'string',
            enum: ['today', 'tomorrow', 'this_week', 'next_week', 'all'],
            description: 'ช่วงเวลาที่ต้องการดู default = today',
          },
          status: {
            type: 'string',
            enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'all'],
            description: 'กรองตามสถานะ default = all',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description:
        'สร้าง task งานใหม่ในปฏิทินของ workspace ใช้เมื่อ user ขอให้สร้างหรือลงตาราง task งาน',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'ชื่อ task งาน (ภาษาไทยหรืออังกฤษก็ได้)',
          },
          date: {
            type: 'string',
            description: 'วันที่ของ task ในรูปแบบ YYYY-MM-DD',
          },
          priority: {
            type: 'string',
            enum: ['HIGH', 'MEDIUM', 'LOW'],
            description: 'ความสำคัญของ task default = MEDIUM',
          },
          description: {
            type: 'string',
            description: 'รายละเอียดเพิ่มเติม (optional)',
          },
        },
        required: ['title', 'date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_room_messages',
      description:
        'ดึงข้อความในห้องแชทเพื่อสรุปหรือวิเคราะห์ ใช้เมื่อ user ขอให้สรุปการสนทนาในห้อง ต้องระบุ room_id เสมอ',
      parameters: {
        type: 'object',
        properties: {
          room_id: {
            type: 'string',
            description: 'UUID ของห้องที่ต้องการดึงข้อความ',
          },
          date_filter: {
            type: 'string',
            enum: ['today', 'yesterday', 'this_week', 'last_3_days'],
            description: 'ช่วงเวลาที่ต้องการสรุป default = today',
          },
        },
        required: ['room_id'],
      },
    },
  },
] as const;

type UsageTracker = { totalTokens: number };

type PublicAiChatResult = {
  reply: string;
  toolsUsed: string[];
  taskCreated?: {
    id: string;
    title: string;
    date: Date;
    priority: TaskPriority;
    status: string;
  };
};

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError(500, 'OPENAI_API_KEY is not configured');
  }

  return new OpenAI({ apiKey });
};

const addUsage = (usage: { total_tokens?: number } | undefined, tracker: UsageTracker) => {
  tracker.totalTokens += usage?.total_tokens ?? 0;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const endOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const buildSystemPrompt = (today: string, workspaceName: string, roomListText: string) => `คุณคือ AI Assistant ของ Tamely ซึ่งเป็นแอปพลิเคชัน Team Collaboration
วันที่วันนี้คือ: ${today}
Workspace ที่ user อยู่: ${workspaceName}
ห้องที่ user เข้าถึงได้:
${roomListText}

กฎการตอบ:
- ตอบเป็นภาษาไทยเสมอ
- ถ้าถามเรื่อง task หรือการสรุปการสนทนา ให้เรียก tool ก่อนตอบ
- ถ้าถามทั่วไป ตอบตรงๆ ไม่ต้องเรียก tool
- ถ้าต้องสรุปการสนทนาแต่ user ไม่บอกชื่อห้อง ให้ถามกลับว่าต้องการสรุปห้องไหน
- ถ้า user บอกชื่อห้องให้ match กับรายการ accessible rooms แล้วใช้ room_id ที่ถูกต้อง
- ถ้า user ขอดูห้องที่ไม่มีสิทธิ์ ให้บอกว่า "คุณไม่มีสิทธิ์เข้าถึงห้องนั้นครับ"
- ห้ามสร้าง task โดยไม่ได้รับการยืนยันจาก user ก่อน (ยกเว้น user สั่งตรงๆ เช่น "ช่วยสร้าง task..." หรือ "ลงตาราง...")
- เมื่อสร้าง task สำเร็จ ให้แจ้งผลลัพธ์พร้อมรายละเอียด task ที่สร้าง`;

const executeGetTasks = async (
  workspaceId: string,
  args: { date_filter?: string; status?: string },
): Promise<string> => {
  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  switch (args.date_filter ?? 'today') {
    case 'today':
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;
    case 'tomorrow': {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      startDate = startOfDay(tomorrow);
      endDate = endOfDay(tomorrow);
      break;
    }
    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), diff));
      endDate = endOfDay(new Date(now.getFullYear(), now.getMonth(), diff + 6));
      break;
    }
    case 'next_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? 1 : 8);
      startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), diff));
      endDate = endOfDay(new Date(now.getFullYear(), now.getMonth(), diff + 6));
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

  if (tasks.length === 0) {
    return 'ไม่พบ task ในช่วงเวลาที่ระบุ';
  }

  return tasks
    .map(
      (task) =>
        `- [${task.status}] ${task.title} | วันที่: ${new Date(task.date).toLocaleDateString('th-TH')} | Priority: ${task.priority} | Assignee: ${task.assignee?.Name ?? 'ไม่ได้กำหนด'}`,
    )
    .join('\n');
};

const executeCreateTask = async (
  workspaceId: string,
  userId: string,
  args: { title?: string; date?: string; priority?: string; description?: string },
): Promise<{
  task: {
    id: string;
    title: string;
    date: Date;
    priority: TaskPriority;
    status: string;
  };
  message: string;
}> => {
  const title = args.title?.trim();
  if (!title) {
    throw new AppError(400, 'Invalid task title from AI');
  }

  const date = args.date ? new Date(args.date) : new Date('');
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, 'Invalid date from AI');
  }

  const priority = ['HIGH', 'MEDIUM', 'LOW'].includes(args.priority ?? '')
    ? (args.priority as TaskPriority)
    : TaskPriority.MEDIUM;

  const task = await repository.createTask(workspaceId, userId, {
    title,
    description: args.description?.trim() || undefined,
    date,
    priority,
  });

  return {
    task,
    message: `สร้าง task "${task.title}" วันที่ ${new Date(task.date).toLocaleDateString('th-TH')} สำเร็จแล้ว`,
  };
};

const executeGetRoomMessages = async (
  workspaceId: string,
  userId: string,
  args: { room_id?: string; date_filter?: string },
  tracker: UsageTracker,
): Promise<string> => {
  const roomId = args.room_id?.trim();
  if (!roomId) {
    return 'ERROR: ต้องระบุ room_id';
  }

  const room = await repository.getRoomById(roomId);
  if (!room) return 'ERROR: ไม่พบห้องนี้';
  if (room.workspaceId !== workspaceId) return 'ERROR: ห้องนี้ไม่ใช่ของ workspace นี้';

  const now = new Date();
  let startDate = startOfDay(now);
  let endDate = endOfDay(now);

  switch (args.date_filter ?? 'today') {
    case 'today':
      break;
    case 'yesterday': {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      startDate = startOfDay(yesterday);
      endDate = endOfDay(yesterday);
      break;
    }
    case 'last_3_days':
      startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2));
      break;
    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), diff));
      break;
    }
    default:
      break;
  }

  const cachedSummary = await repository.findSummaryCache(roomId, startDate, endDate);
  if (cachedSummary) {
    return cachedSummary.summaryText;
  }

  const totalCount = await repository.countMessages(roomId, startDate, endDate);
  if (totalCount === 0) {
    return `ไม่มีข้อความในห้อง "${room.name}" ช่วงเวลาที่ระบุ`;
  }

  if (totalCount > MAX_MESSAGES) {
    return `ข้อความในห้อง "${room.name}" มีมากเกินไป (${totalCount} ข้อความ) กรุณาระบุช่วงเวลาที่แคบกว่านี้ เช่น "สรุปวันนี้" หรือ "สรุปเมื่อวาน"`;
  }

  const chunks: string[] = [];
  let offset = 0;

  while (offset < totalCount) {
    const messages = await repository.getMessages(roomId, {
      limit: CHUNK_SIZE,
      offset,
      startDate,
      endDate,
    });

    if (messages.length === 0) break;

    const chunkText = messages
      .map(
        (message) =>
          `[${new Date(message.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}] ${message.sender.Name}: ${message.content}`,
      )
      .join('\n');

    chunks.push(chunkText);
    offset += messages.length;
  }

  if (chunks.length <= 1) {
    return `ข้อความในห้อง "${room.name}":\n${chunks[0] ?? ''}`;
  }

  const openai = getOpenAIClient();
  const summaryResponses = await Promise.all(
    chunks.map((chunk) =>
      openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'สรุปการสนทนาในห้อง chat นี้เป็นภาษาไทย ให้กระชับ เน้น key points สำคัญ',
          },
          { role: 'user', content: chunk },
        ],
        max_tokens: 400,
      }),
    ),
  );

  summaryResponses.forEach((response) => addUsage(response.usage, tracker));

  const miniSummaries = summaryResponses
    .map((response, index) => `[ส่วนที่ ${index + 1}] ${response.choices[0]?.message?.content ?? ''}`)
    .join('\n\n');

  const finalSummaryResponse = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: 'นี่คือสรุปการสนทนาแบ่งเป็นช่วงๆ กรุณารวมและสรุปเป็นภาษาไทยที่เชื่อมกันสมบูรณ์',
      },
      { role: 'user', content: miniSummaries },
    ],
    max_tokens: 600,
  });

  addUsage(finalSummaryResponse.usage, tracker);

  const finalSummary = finalSummaryResponse.choices[0]?.message?.content?.trim() ?? '';

  if (finalSummary) {
    await repository.saveSummaryCache({
      workspaceId,
      roomId,
      requestedById: userId,
      periodStart: startDate,
      periodEnd: endDate,
      summaryText: finalSummary,
    });
  }

  return finalSummary || `สรุปการสนทนาในห้อง "${room.name}" ไม่สำเร็จ`;
};

export const processAiChat = async (params: {
  workspaceId: string;
  userId: string;
  message: string;
  history: TypeHistoryItem[];
}): Promise<PublicAiChatResult> => {
  const member = await repository.findWorkspaceMember(params.workspaceId, params.userId);
  if (!member) {
    throw new AppError(403, 'You are not a member of this workspace');
  }

  const workspace = await repository.findWorkspaceById(params.workspaceId);
  if (!workspace) {
    throw new AppError(404, 'Workspace not found');
  }

  const accessibleRooms = await repository.getAccessibleRooms(params.workspaceId, params.userId);
  const roomListText =
    accessibleRooms.length > 0
      ? accessibleRooms.map((room) => `- ${room.name} (id: ${room.id})`).join('\n')
      : '- ไม่มีห้องที่เข้าถึงได้';

  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const currentMessages: any[] = [
    {
      role: 'system',
      content: buildSystemPrompt(today, workspace.name, roomListText),
    },
    ...params.history.slice(-10).map((item) => ({
      role: item.role,
      content: item.content,
    })),
    { role: 'user', content: params.message },
  ];

  const openai = getOpenAIClient();
  const toolsUsed: string[] = [];
  const tracker: UsageTracker = { totalTokens: 0 };
  let taskCreated: PublicAiChatResult['taskCreated'];
  let finalReply = '';

  for (let i = 0; i < MAX_TOOL_LOOPS; i += 1) {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: currentMessages,
      tools: TOOL_DEFINITIONS as any,
      tool_choice: 'auto',
      max_tokens: 1500,
    });

    addUsage(response.usage, tracker);

    const choice = response.choices[0];
    if (!choice) {
      break;
    }

    if (choice.finish_reason === 'stop') {
      finalReply = choice.message.content?.trim() ?? '';
      break;
    }

    if (choice.finish_reason !== 'tool_calls') {
      finalReply = choice.message.content?.trim() ?? '';
      break;
    }

    const toolCalls = choice.message.tool_calls ?? [];
    if (toolCalls.length === 0) {
      finalReply = choice.message.content?.trim() ?? '';
      break;
    }

    const toolResults: Array<{ role: 'tool'; tool_call_id: string; content: string }> = [];

    for (const toolCall of toolCalls) {
      if (toolCall.type !== 'function') {
        continue;
      }

      const toolName = toolCall.function.name;
      if (!toolsUsed.includes(toolName)) {
        toolsUsed.push(toolName);
      }

      let toolResult = 'ERROR: ไม่สามารถประมวลผล tool นี้ได้';

      try {
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

        if (toolName === 'get_tasks') {
          toolResult = await executeGetTasks(params.workspaceId, toolArgs);
        } else if (toolName === 'create_task') {
          const result = await executeCreateTask(params.workspaceId, params.userId, toolArgs);
          taskCreated = result.task;
          toolResult = result.message;
        } else if (toolName === 'get_room_messages') {
          const canAccess = await repository.canUserAccessRoom(
            toolArgs.room_id,
            params.userId,
            params.workspaceId,
          );

          if (!canAccess) {
            toolResult = 'ERROR: ผู้ใช้ไม่มีสิทธิ์เข้าถึงห้องนี้';
          } else {
            toolResult = await executeGetRoomMessages(
              params.workspaceId,
              params.userId,
              toolArgs,
              tracker,
            );
          }
        }
      } catch (error) {
        toolResult =
          error instanceof AppError
            ? `ERROR: ${error.message}`
            : 'ERROR: เกิดข้อผิดพลาดระหว่างเรียกใช้งาน tool';
      }

      toolResults.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolResult,
      });
    }

    currentMessages.push(choice.message as any, ...toolResults);
  }

  if (!finalReply) {
    finalReply = 'ขออภัยครับ ตอนนี้ผมไม่สามารถตอบกลับได้ กรุณาลองใหม่อีกครั้ง';
  }

  repository
    .logAiQuery({
      workspaceId: params.workspaceId,
      userId: params.userId,
      question: params.message,
      answer: finalReply,
      tokensUsed: tracker.totalTokens || undefined,
    })
    .catch((error) => {
      console.error('Failed to log AI query:', error);
    });

  return {
    reply: finalReply,
    toolsUsed,
    ...(taskCreated ? { taskCreated } : {}),
  };
};
