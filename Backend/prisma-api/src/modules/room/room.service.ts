import { WorkspaceRole } from '@prisma/client';
import { AppError } from '../../types';
import { PERMISSIONS } from '../../types/permissions';
import { hasPermission } from '../../utils/permissions';
import { TypePayloadCreateRoom, TypePayloadUpdateRoom } from './room.model';
import * as roomRepository from './room.repository';

/* ======================= HELPERS ======================= */

const assertWorkspaceMember = async (workspaceId: string, userId: string) => {
  const member = await roomRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');
  return member;
};

const assertManageChannelsPermission = async (workspaceId: string, userId: string) => {
  await assertWorkspaceMember(workspaceId, userId);
  const allowed = await hasPermission(workspaceId, userId, PERMISSIONS.MANAGE_CHANNELS);
  if (!allowed) {
    throw new AppError(403, 'Insufficient permissions');
  }
};

/* ======================= CREATE ======================= */

export const createRoom = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadCreateRoom,
) => {
  await assertManageChannelsPermission(workspaceId, userId);

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
  await assertManageChannelsPermission(workspaceId, userId);

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
    const { workspaceMembers, customRoles, ...userFields } = m.user as typeof m.user & {
      workspaceMembers: { role: string }[];
      customRoles: { customRole: { id: string; name: string; color: string; position: number; permissions: string[] } }[];
    };
    const workspaceRole = workspaceMembers[0]?.role ?? 'MEMBER';
    const mappedCustomRoles = (customRoles ?? []).map((cr) => cr.customRole);
    return { ...m, user: { ...userFields, workspaceRole, customRoles: mappedCustomRoles } };
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

  await assertManageChannelsPermission(room.workspaceId, userId);

  const updatedRoom = await roomRepository.update(roomId, data);
  return { ...updatedRoom, memberCount: updatedRoom._count.members };
};

/* ======================= DELETE ======================= */

export const deleteRoom = async (roomId: string, userId: string) => {
  const room = await roomRepository.findByIdSimple(roomId);
  if (!room) throw new AppError(404, 'Room not found');

  await assertManageChannelsPermission(room.workspaceId, userId);

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

  await assertManageChannelsPermission(room.workspaceId, requesterId);
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
    await assertManageChannelsPermission(room.workspaceId, requesterId);
  }

  await roomRepository.deleteRoomMember(roomId, targetUserId);
};
