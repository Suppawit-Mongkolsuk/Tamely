import { prisma } from '../../index';
import { CreateRoomPayload, UpdateRoomPayload } from '../../types';
import { WorkspaceRole } from '@prisma/client';

const assertWorkspaceMember = async (workspaceId: string, userId: string) => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) throw new Error('You are not a member of this workspace');
  return member;
};

export const createRoom = async (
  workspaceId: string,
  userId: string,
  data: CreateRoomPayload,
) => {
  await assertWorkspaceMember(workspaceId, userId);

  const room = await prisma.room.create({
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
      createdBy: { select: { id: true, Name: true, avatarUrl: true } },
    },
  });

  return { ...room, memberCount: room._count.members };
};

export const getRooms = async (workspaceId: string, userId: string) => {
  await assertWorkspaceMember(workspaceId, userId);

  const rooms = await prisma.room.findMany({
    where: { workspaceId, isActive: true },
    include: {
      _count: { select: { members: true } },
      createdBy: { select: { id: true, Name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return rooms.map((r) => ({
    ...r,
    memberCount: r._count.members,
  }));
};

export const getRoomById = async (roomId: string, userId: string) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      _count: { select: { members: true } },
      createdBy: { select: { id: true, Name: true, avatarUrl: true } },
      members: {
        include: {
          user: {
            select: { id: true, Name: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  });
  if (!room) throw new Error('Room not found');

  await assertWorkspaceMember(room.workspaceId, userId);

  return {
    ...room,
    memberCount: room._count.members,
  };
};

export const updateRoom = async (
  roomId: string,
  userId: string,
  data: UpdateRoomPayload,
) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: room.workspaceId, userId },
    },
  });
  if (
    !member ||
    (member.role !== WorkspaceRole.OWNER &&
      member.role !== WorkspaceRole.ADMIN &&
      room.createdById !== userId)
  ) {
    throw new Error('Only workspace owner/admin or room creator can update');
  }

  return prisma.room.update({
    where: { id: roomId },
    data,
    include: {
      _count: { select: { members: true } },
    },
  });
};

export const deleteRoom = async (roomId: string, userId: string) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: room.workspaceId, userId },
    },
  });
  if (
    !member ||
    (member.role !== WorkspaceRole.OWNER &&
      member.role !== WorkspaceRole.ADMIN &&
      room.createdById !== userId)
  ) {
    throw new Error('Only workspace owner/admin or room creator can delete');
  }

  await prisma.room.delete({ where: { id: roomId } });
};

export const addRoomMember = async (
  roomId: string,
  requesterId: string,
  targetUserId: string,
) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');

  await assertWorkspaceMember(room.workspaceId, targetUserId);

  const existing = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: targetUserId } },
  });
  if (existing) throw new Error('User is already a member of this room');

  return prisma.roomMember.create({
    data: { roomId, userId: targetUserId },
    include: {
      user: {
        select: { id: true, Name: true, email: true, avatarUrl: true },
      },
    },
  });
};

export const joinRoom = async (roomId: string, userId: string) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');

  if (room.isPrivate) {
    throw new Error('Cannot join a private room without an invitation');
  }

  await assertWorkspaceMember(room.workspaceId, userId);

  const existing = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (existing) throw new Error('You are already a member of this room');

  return prisma.roomMember.create({
    data: { roomId, userId },
    include: {
      user: {
        select: { id: true, Name: true, email: true, avatarUrl: true },
      },
    },
  });
};

export const removeRoomMember = async (
  roomId: string,
  requesterId: string,
  targetUserId: string,
) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');

  if (requesterId !== targetUserId) {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: room.workspaceId, userId: requesterId },
      },
    });
    if (
      !member ||
      (member.role !== WorkspaceRole.OWNER &&
        member.role !== WorkspaceRole.ADMIN)
    ) {
      throw new Error('Only workspace owner/admin can remove others');
    }
  }

  await prisma.roomMember.delete({
    where: { roomId_userId: { roomId, userId: targetUserId } },
  });
};
