import { prisma } from '../../index';
import { TaskCreator, TaskPriority, TaskStatus } from '@prisma/client';
import { PERMISSIONS } from '../../types/permissions';
import { hasPermission } from '../../utils/permissions';

export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
};

export const findUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { Name: true },
  });
};

export const findWorkspaceById = async (workspaceId: string) => {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true },
  });
};

export const canUserAccessRoom = async (
  roomId: string,
  userId: string,
  workspaceId: string,
): Promise<boolean> => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) return false;
  if (await hasPermission(workspaceId, userId, PERMISSIONS.VIEW_PRIVATE_CHANNELS)) return true;

  const roomMember = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });

  return !!roomMember;
};

export const getAccessibleRooms = async (workspaceId: string, userId: string) => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) return [];

  const canViewPrivateChannels = await hasPermission(
    workspaceId,
    userId,
    PERMISSIONS.VIEW_PRIVATE_CHANNELS,
  );

  return prisma.room.findMany({
    where: {
      workspaceId,
      isActive: true,
      ...(canViewPrivateChannels ? {} : { members: { some: { userId } } }),
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
};

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

  if (filters.status) {
    where.status = filters.status;
  }

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
    take: 50,
  });
};

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
      assigneeId: data.assigneeId ?? userId,
      createdById: userId,
      createdBy: TaskCreator.AI,
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

export const countMessages = async (
  roomId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<number> => {
  return prisma.message.count({
    where: {
      roomId,
      type: 'TEXT',
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

export const getRoomById = async (roomId: string) => {
  return prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, name: true, workspaceId: true },
  });
};

export const findSummaryCache = async (
  roomId: string,
  periodStart: Date,
  periodEnd: Date,
) => {
  return prisma.aiSummary.findFirst({
    where: {
      roomId,
      periodStart,
      periodEnd,
    },
    orderBy: { createdAt: 'desc' },
  });
};

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

export const logAiQuery = async (data: {
  workspaceId: string;
  userId: string;
  sessionId?: string;
  question: string;
  answer: string;
  tokensUsed?: number;
}) => {
  return prisma.aiQuery.create({ data });
};

/* ======================= AI SESSION ======================= */

// สร้าง session ใหม่ (เรียกตอนส่งข้อความครั้งแรกของ session)
export const createSession = async (data: {
  id: string; // sessionId
  workspaceId: string;
  userId: string;
  title: string;
}) => {
  return prisma.aiSession.upsert({
    where: { id: data.id },
    create: data,
    update: { updatedAt: new Date() }, // ถ้ามีแล้ว update เวลา
  });
};

// ดึงรายการ sessions — pinned ขึ้นก่อน แล้วเรียงตาม updatedAt
export const getSessionList = async (workspaceId: string, userId: string) => {
  return prisma.aiSession.findMany({
    where: { workspaceId, userId },
    select: { id: true, title: true, isPinned: true, updatedAt: true },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
  });
};

// เปลี่ยนชื่อ session
export const renameSession = async (sessionId: string, userId: string, title: string) => {
  return prisma.aiSession.updateMany({
    where: { id: sessionId, userId },
    data: { title: title.trim().slice(0, 80) },
  });
};

// toggle pin
export const togglePinSession = async (sessionId: string, userId: string, isPinned: boolean) => {
  return prisma.aiSession.updateMany({
    where: { id: sessionId, userId },
    data: { isPinned },
  });
};

// ลบ session + messages ทั้งหมดในนั้น
export const deleteSession = async (sessionId: string, userId: string) => {
  await prisma.aiQuery.deleteMany({ where: { sessionId, userId } });
  await prisma.aiSession.deleteMany({ where: { id: sessionId, userId } });
};

// ดึง messages ของ session นั้น
export const getSessionMessages = async (
  workspaceId: string,
  userId: string,
  sessionId: string,
) => {
  return prisma.aiQuery.findMany({
    where: { workspaceId, userId, sessionId },
    select: { id: true, question: true, answer: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
};

export const getRecentQueries = async (
  workspaceId: string,
  userId: string,
  sessionId?: string,
  limit = 10,
) => {
  return prisma.aiQuery.findMany({
    where: {
      workspaceId,
      userId,
      ...(sessionId ? { sessionId } : {}),
    },
    select: { id: true, question: true, answer: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};
