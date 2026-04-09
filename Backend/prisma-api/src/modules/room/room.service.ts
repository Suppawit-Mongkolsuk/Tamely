import { WorkspaceRole } from '@prisma/client';
import { AppError } from '../../types';
import { TypePayloadCreateRoom, TypePayloadUpdateRoom } from './room.model';
import * as roomRepository from './room.repository';

/* ======================= HELPERS ======================= */

const assertWorkspaceMember = async (workspaceId: string, userId: string) => {
  const member = await roomRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');
  return member;
};

/* ======================= CREATE ======================= */

export const createRoom = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadCreateRoom,
) => {
  await assertWorkspaceMember(workspaceId, userId);

  const room = await roomRepository.create(workspaceId, userId, data);
  return { ...room, memberCount: room._count.members };
};

/* ======================= READ ======================= */

export const getRooms = async (workspaceId: string, userId: string) => {
  await assertWorkspaceMember(workspaceId, userId);

  const rooms = await roomRepository.findMany(workspaceId);
  return rooms.map((r) => ({
    ...r,
    memberCount: r._count.members,
  }));
};

export const getRoomById = async (roomId: string, userId: string) => {
  const room = await roomRepository.findById(roomId);
  if (!room) throw new AppError(404, 'Room not found');

  await assertWorkspaceMember(room.workspaceId, userId);

  return { ...room, memberCount: room._count.members };
};

/* ======================= UPDATE ======================= */

export const updateRoom = async (
  roomId: string,
  userId: string,
  data: TypePayloadUpdateRoom,
) => {
  const room = await roomRepository.findByIdSimple(roomId);
  if (!room) throw new AppError(404, 'Room not found');

  const member = await roomRepository.findWorkspaceMember(room.workspaceId, userId);
  if (
    !member ||
    (member.role !== WorkspaceRole.OWNER &&
      member.role !== WorkspaceRole.ADMIN &&
      room.createdById !== userId)
  ) {
    throw new AppError(403, 'Only workspace owner/admin or room creator can update');
  }

  return roomRepository.update(roomId, data);
};

/* ======================= DELETE ======================= */

export const deleteRoom = async (roomId: string, userId: string) => {
  const room = await roomRepository.findByIdSimple(roomId);
  if (!room) throw new AppError(404, 'Room not found');

  const member = await roomRepository.findWorkspaceMember(room.workspaceId, userId);
  if (
    !member ||
    (member.role !== WorkspaceRole.OWNER &&
      member.role !== WorkspaceRole.ADMIN &&
      room.createdById !== userId)
  ) {
    throw new AppError(403, 'Only workspace owner/admin or room creator can delete');
  }

  await roomRepository.remove(roomId);
};

/* ======================= MEMBERS ======================= */

export const addRoomMember = async (
  roomId: string,
  _requesterId: string,
  targetUserId: string,
) => {
  const room = await roomRepository.findByIdSimple(roomId);
  if (!room) throw new AppError(404, 'Room not found');

  await assertWorkspaceMember(room.workspaceId, targetUserId);

  const existing = await roomRepository.findRoomMember(roomId, targetUserId);
  if (existing) throw new AppError(409, 'User is already a member of this room');

  return roomRepository.createRoomMember(roomId, targetUserId);
};

export const joinRoom = async (roomId: string, userId: string) => {
  const room = await roomRepository.findByIdSimple(roomId);
  if (!room) throw new AppError(404, 'Room not found');

  if (room.isPrivate) {
    throw new AppError(403, 'Cannot join a private room without an invitation');
  }

  await assertWorkspaceMember(room.workspaceId, userId);

  const existing = await roomRepository.findRoomMember(roomId, userId);
  if (existing) throw new AppError(409, 'You are already a member of this room');

  return roomRepository.createRoomMember(roomId, userId);
};

export const removeRoomMember = async (
  roomId: string,
  requesterId: string,
  targetUserId: string,
) => {
  const room = await roomRepository.findByIdSimple(roomId);
  if (!room) throw new AppError(404, 'Room not found');

  if (requesterId !== targetUserId) {
    const member = await roomRepository.findWorkspaceMember(room.workspaceId, requesterId);
    if (
      !member ||
      (member.role !== WorkspaceRole.OWNER &&
        member.role !== WorkspaceRole.ADMIN)
    ) {
      throw new AppError(403, 'Only workspace owner/admin can remove others');
    }
  }

  await roomRepository.deleteRoomMember(roomId, targetUserId);
};
