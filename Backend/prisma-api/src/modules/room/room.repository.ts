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

export const findMany = async (workspaceId: string) => {
  return prisma.room.findMany({
    where: { workspaceId, isActive: true },
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
          user: { select: memberUserSelect },
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
  return prisma.roomMember.delete({
    where: { roomId_userId: { roomId, userId } },
  });
};

/* ======================= WORKSPACE MEMBER CHECK ======================= */

export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
};
