import { Prisma, WorkspaceRole } from '@prisma/client';
import { prisma } from '../../index';
import { TypePayloadCreateRoom, TypePayloadUpdateRoom } from './room.model';

/* ======================= SELECTS ======================= */

const creatorSelect = { id: true, Name: true, avatarUrl: true } as const;
const memberUserSelect = { id: true, Name: true, avatarUrl: true } as const;
const customRoleSelect = { id: true, name: true, color: true, position: true, permissions: true } as const;
const roomBaseSelect = {
  id: true,
  workspaceId: true,
  name: true,
  description: true,
  isPrivate: true,
  createdById: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;
const roomSummarySelect = {
  ...roomBaseSelect,
  _count: { select: { members: true } },
  createdBy: { select: creatorSelect },
} as const;
const roomDetailSelect = {
  ...roomSummarySelect,
  members: {
    select: {
      userId: true,
      user: {
        select: {
          ...memberUserSelect,
          workspaceMembers: {
            select: { role: true },
          },
        },
      },
    },
  },
} as const;

/* ======================= CREATE ======================= */

export const create = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadCreateRoom,
) => {
  return prisma.room.create({
    data: {
      workspaceId,
      name: data.name,
      description: data.description,
      isPrivate: data.isPrivate ?? false,
      allowedRoles: (data.allowedRoles ?? []) as WorkspaceRole[],
      createdById: userId,
      members: {
        create: { userId },
      },
    },
    select: roomSummarySelect,
  });
};

/* ======================= READ ======================= */

export const findMany = async (workspaceId: string, userId: string, userRole: WorkspaceRole) => {
  return prisma.room.findMany({
    where: {
      workspaceId,
      isActive: true,
      // ต้องเป็น RoomMember ก่อน (ถ้าถูกเตะออกก็ไม่เห็น)
      members: { some: { userId } },
      OR: [
        { allowedRoles: { isEmpty: true } }, // [] = ALL สามารถเข้าได้
        { allowedRoles: { has: userRole } },  // role ของ user อยู่ใน list
      ],
    },
    select: roomSummarySelect,
    orderBy: { createdAt: 'asc' },
  });
};

export const findManyForManagement = async (workspaceId: string) => {
  return prisma.room.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
    select: roomSummarySelect,
    orderBy: { createdAt: 'asc' },
  });
};

export const countUnreadByRoomIds = async (userId: string, roomIds: string[]) => {
  if (roomIds.length === 0) {
    return new Map<string, number>();
  }

  const roomIdList = Prisma.join(
    roomIds.map((roomId) => Prisma.sql`${roomId}::uuid`),
  );

  const rows = await prisma.$queryRaw<
    Array<{ roomId: string; unreadCount: bigint | number }>
  >(Prisma.sql`
    SELECT
      rm."roomId",
      COUNT(m."id")::bigint AS "unreadCount"
    FROM "RoomMember" rm
    LEFT JOIN "Message" m
      ON m."roomId" = rm."roomId"
     AND m."senderId" <> rm."userId"
     AND m."createdAt" > rm."lastReadAt"
    WHERE rm."userId" = ${Prisma.sql`${userId}::uuid`}
      AND rm."roomId" IN (${roomIdList})
    GROUP BY rm."roomId"
  `);

  return new Map(
    rows.map((row) => [row.roomId, Number(row.unreadCount)]),
  );
};

export const findById = async (roomId: string, workspaceId?: string) => {
  return prisma.room.findUnique({
    where: { id: roomId },
    select: {
      ...roomDetailSelect,
      members: {
        select: {
          userId: true,
          user: {
            select: {
              ...memberUserSelect,
              workspaceMembers: {
                where: workspaceId ? { workspaceId } : undefined,
                select: { role: true },
              },
              customRoles: {
                where: workspaceId ? { workspaceId } : undefined,
                select: { customRole: { select: customRoleSelect } },
              },
            },
          },
        },
      },
    },
  });
};

export const findByIdSimple = async (roomId: string) => {
  return prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, workspaceId: true, createdById: true, isPrivate: true },
  });
};

/* ======================= UPDATE ======================= */

export const update = async (roomId: string, data: TypePayloadUpdateRoom) => {
  return prisma.room.update({
    where: { id: roomId },
    data,
    select: roomSummarySelect,
  });
};

/* ======================= DELETE ======================= */

export const remove = async (roomId: string) => {
  return prisma.room.delete({ where: { id: roomId } });
};

/* ======================= MEMBERS ======================= */

export const findRoomMember = async (roomId: string, userId: string) => {
  return prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { roomId: true, userId: true },
  });
};

export const createRoomMember = async (roomId: string, userId: string) => {
  return prisma.roomMember.create({
    data: { roomId, userId },
    select: {
      userId: true,
      user: { select: memberUserSelect },
    },
  });
};

export const deleteRoomMember = async (roomId: string, userId: string) => {
  // deleteMany แทน delete เพื่อไม่ throw error กรณี user ไม่ได้เป็น RoomMember
  await prisma.roomMember.deleteMany({
    where: { roomId, userId },
  });
};
