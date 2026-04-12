import { WorkspaceRole } from '@prisma/client';
import { prisma } from '../../index';
import { TypePayloadCreateRoom, TypePayloadUpdateRoom } from './room.model';

/* ======================= SELECTS ======================= */

const creatorSelect = { id: true, Name: true, avatarUrl: true } as const;
const memberUserSelect = { id: true, Name: true, email: true, avatarUrl: true } as const;

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
    include: {
      _count: { select: { members: true } },
      createdBy: { select: creatorSelect },
    },
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
    include: {
      _count: { select: { members: true } },
      createdBy: { select: creatorSelect },
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const findById = async (roomId: string) => {
  return prisma.room.findUnique({
    where: { id: roomId },
    include: {
      _count: { select: { members: true } },
      createdBy: { select: creatorSelect },
      members: {
        include: {
          user: {
            select: {
              ...memberUserSelect,
              // ดึง workspace role มาด้วยเพื่อแสดงในห้อง
              workspaceMembers: {
                select: { workspaceId: true, role: true },
              },
            },
          },
        },
      },
    },
  });
};

export const findByIdSimple = async (roomId: string) => {
  return prisma.room.findUnique({ where: { id: roomId } });
};

/* ======================= UPDATE ======================= */

export const update = async (roomId: string, data: TypePayloadUpdateRoom) => {
  return prisma.room.update({
    where: { id: roomId },
    data,
    include: {
      _count: { select: { members: true } },
    },
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
  });
};

export const createRoomMember = async (roomId: string, userId: string) => {
  return prisma.roomMember.create({
    data: { roomId, userId },
    include: {
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

/* ======================= WORKSPACE MEMBER CHECK ======================= */

export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
};
