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

const assertWorkspaceAdmin = async (workspaceId: string, userId: string) => {
  const member = await assertWorkspaceMember(workspaceId, userId);
  if (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN) {
    throw new AppError(403, 'Only workspace owner/admin can manage rooms');
  }
  return member;
};

/* ======================= CREATE ======================= */

export const createRoom = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadCreateRoom,
) => {
  await assertWorkspaceAdmin(workspaceId, userId);

  const room = await roomRepository.create(workspaceId, userId, data);
  return { ...room, memberCount: room._count.members, unreadCount: 0 };
};

/* ======================= READ ======================= */

export const getRooms = async (workspaceId: string, userId: string) => {
  const member = await assertWorkspaceMember(workspaceId, userId);

  // filter เฉพาะห้องที่ user เป็น RoomMember และมีสิทธิ์เข้าถึงตาม role
  const rooms = await roomRepository.findMany(workspaceId, userId, member.role);
  const unreadMap = await roomRepository.countUnreadByRoomIds(
    userId,
    rooms.map((room) => room.id),
  );

  return rooms.map((r) => ({
    ...r,
    memberCount: r._count.members,
    unreadCount: unreadMap.get(r.id) ?? 0,
  }));
};

export const getManagementRooms = async (workspaceId: string, userId: string) => {
  await assertWorkspaceAdmin(workspaceId, userId);

  const rooms = await roomRepository.findManyForManagement(workspaceId);
  return rooms.map((room) => ({
    ...room,
    memberCount: room._count.members,
  }));
};

export const getRoomById = async (roomId: string, userId: string) => {
  // ดึงข้อมูล room พร้อม workspaceId เพื่อใช้ filter workspaceMembers
  const roomSimple = await roomRepository.findByIdSimple(roomId);
  if (!roomSimple) throw new AppError(404, 'Room not found');

  await assertWorkspaceMember(roomSimple.workspaceId, userId);

  const room = await roomRepository.findById(roomId, roomSimple.workspaceId);
  if (!room) throw new AppError(404, 'Room not found');

  // Map สมาชิก — workspaceMembers[0] คือ role ใน workspace นี้ (filtered by workspaceId)
  const members = (room.members ?? []).map((m) => {
    const { workspaceMembers, ...userFields } = m.user as typeof m.user & {
      workspaceMembers: { role: string }[];
    };
    const workspaceRole = workspaceMembers[0]?.role ?? 'MEMBER';
    return { ...m, user: { ...userFields, workspaceRole } };
  });

  return { ...room, memberCount: room._count.members, members };
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

  const updatedRoom = await roomRepository.update(roomId, data);
  return { ...updatedRoom, memberCount: updatedRoom._count.members };
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
  requesterId: string,
  targetUserId: string,
) => {
  const room = await roomRepository.findByIdSimple(roomId);
  if (!room) throw new AppError(404, 'Room not found');

  await assertWorkspaceAdmin(room.workspaceId, requesterId);
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
