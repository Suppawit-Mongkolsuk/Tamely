import { WorkspaceRole } from '@prisma/client';
import { AppError } from '../../types';
import { PERMISSIONS } from '../../types/permissions';
import { getUserPermissionsArray, hasPermission } from '../../utils/permissions';
import {
  uploadWorkspaceIcon,
  deleteOldWorkspaceIcon,
} from '../../utils/supabase-storage';
import {
  TypePayloadCreateWorkspace,
  TypePayloadUpdateWorkspace,
  TypePayloadUpdateMemberRole,
} from './workspace.model';
import * as workspaceRepository from './workspace.repository';

/* ======================= CREATE ======================= */

export const createWorkspace = async (
  ownerId: string,
  data: TypePayloadCreateWorkspace,
) => {
  const workspace = await workspaceRepository.create(ownerId, data);
  return {
    ...workspace,
    role: WorkspaceRole.OWNER,
    myPermissions: await getUserPermissionsArray(workspace.id, ownerId),
  };
};

/* ======================= READ ======================= */

export const getUserWorkspaces = async (userId: string) => {
  const memberships = await workspaceRepository.findMembershipsByUser(userId);

  return Promise.all(
    memberships.map(async (m) => ({
      ...m.workspace,
      role: m.role,
      joinedAt: m.joinedAt,
      memberCount: m.workspace._count.members,
      roomCount: m.workspace._count.rooms,
      myPermissions: await getUserPermissionsArray(m.workspace.id, userId),
    })),
  );
};

export const getWorkspaceById = async (
  workspaceId: string,
  userId: string,
) => {
  const member = await workspaceRepository.findWorkspaceMemberDetailed(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new AppError(404, 'Workspace not found');

  return {
    ...workspace,
    role: member.role,
    myPermissions: await getUserPermissionsArray(workspaceId, userId),
    myCustomRoles: member.user.customRoles.map((item) => item.customRole),
  };
};

/* ======================= UPDATE ======================= */

export const updateWorkspace = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadUpdateWorkspace,
) => {
  const member = await workspaceRepository.findWorkspaceMemberDetailed(workspaceId, userId);
  if (!member) {
    throw new AppError(403, 'You are not a member of this workspace');
  }

  const allowed = await hasPermission(workspaceId, userId, PERMISSIONS.MANAGE_WORKSPACE);
  if (!allowed) {
    throw new AppError(403, 'Insufficient permissions');
  }

  const updatedWorkspace = await workspaceRepository.update(workspaceId, data);
  return {
    ...updatedWorkspace,
    role: member.role,
    myPermissions: await getUserPermissionsArray(workspaceId, userId),
    myCustomRoles: member.user.customRoles.map((item) => item.customRole),
  };
};

export const updateWorkspaceIcon = async (
  workspaceId: string,
  userId: string,
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
) => {
  const allowed = await hasPermission(workspaceId, userId, PERMISSIONS.MANAGE_WORKSPACE);
  if (!allowed) throw new AppError(403, 'Insufficient permissions');

  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new AppError(404, 'Workspace not found');

  await deleteOldWorkspaceIcon(workspace.iconUrl ?? null);

  const iconUrl = await uploadWorkspaceIcon(workspaceId, fileBuffer, mimeType, originalName);
  const updated = await workspaceRepository.update(workspaceId, { iconUrl });

  return { iconUrl: updated.iconUrl };
};

/* ======================= DELETE ======================= */

export const deleteWorkspace = async (
  workspaceId: string,
  userId: string,
) => {
  const workspace = await workspaceRepository.findByIdSimple(workspaceId);
  if (!workspace) throw new AppError(404, 'Workspace not found');
  if (workspace.ownerId !== userId) {
    throw new AppError(403, 'Only the owner can delete this workspace');
  }

  await workspaceRepository.remove(workspaceId);
};

/* ======================= MEMBERS ======================= */

export const getMembers = async (workspaceId: string, userId: string) => {
  const member = await workspaceRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  const members = await workspaceRepository.findAllMembers(workspaceId);
  return members.map((workspaceMember) => ({
    ...workspaceMember,
    customRoles: workspaceMember.user.customRoles.map((item) => item.customRole),
  }));
};

export const addMemberByEmail = async (
  workspaceId: string,
  requesterId: string,
  email: string,
  role: WorkspaceRole = WorkspaceRole.MEMBER,
) => {
  const requester = await workspaceRepository.findWorkspaceMember(workspaceId, requesterId);
  if (!requester) {
    throw new AppError(403, 'You are not a member of this workspace');
  }

  const allowed = await hasPermission(workspaceId, requesterId, PERMISSIONS.MANAGE_MEMBERS);
  if (!allowed) {
    throw new AppError(403, 'Insufficient permissions');
  }

  const user = await workspaceRepository.findUserByEmail(email);
  if (!user) throw new AppError(404, 'User not found with this email');

  const existing = await workspaceRepository.findWorkspaceMember(workspaceId, user.id);
  if (existing) throw new AppError(409, 'User is already a member');

  return workspaceRepository.createMember(workspaceId, user.id, role);
};

export const joinByInviteCode = async (
  inviteCode: string,
  userId: string,
) => {
  const workspace = await workspaceRepository.findByInviteCode(inviteCode);
  if (!workspace) throw new AppError(400, 'Invalid invite code');

  const existing = await workspaceRepository.findWorkspaceMember(workspace.id, userId);
  if (existing) throw new AppError(409, 'You are already a member');

  await workspaceRepository.createMember(workspace.id, userId, WorkspaceRole.MEMBER);

  return {
    ...workspace,
    role: WorkspaceRole.MEMBER,
    myPermissions: await getUserPermissionsArray(workspace.id, userId),
  };
};

export const removeMember = async (
  workspaceId: string,
  requesterId: string,
  targetUserId: string,
) => {
  const workspace = await workspaceRepository.findByIdSimple(workspaceId);
  if (!workspace) throw new AppError(404, 'Workspace not found');

  if (targetUserId === workspace.ownerId) {
    throw new AppError(403, 'Cannot remove the workspace owner');
  }

  if (requesterId !== targetUserId) {
    const requester = await workspaceRepository.findWorkspaceMember(workspaceId, requesterId);
    if (!requester) {
      throw new AppError(403, 'You are not a member of this workspace');
    }

    const allowed = await hasPermission(workspaceId, requesterId, PERMISSIONS.MANAGE_MEMBERS);
    if (!allowed) {
      throw new AppError(403, 'Insufficient permissions');
    }
  }

  await workspaceRepository.deleteMember(workspaceId, targetUserId);
};

export const updateMemberRole = async (
  workspaceId: string,
  requesterId: string,
  targetUserId: string,
  data: TypePayloadUpdateMemberRole,
) => {
  const workspace = await workspaceRepository.findByIdSimple(workspaceId);
  if (!workspace) throw new AppError(404, 'Workspace not found');

  const requester = await workspaceRepository.findWorkspaceMember(workspaceId, requesterId);
  if (!requester) {
    throw new AppError(403, 'You are not a member of this workspace');
  }

  const allowed = await hasPermission(workspaceId, requesterId, PERMISSIONS.MANAGE_MEMBERS);
  if (!allowed) {
    throw new AppError(403, 'Insufficient permissions');
  }

  if (targetUserId === workspace.ownerId) {
    throw new AppError(403, 'Cannot change the owner role');
  }

  return workspaceRepository.updateMemberRole(workspaceId, targetUserId, data.role);
};

export const regenerateInviteCode = async (
  workspaceId: string,
  userId: string,
) => {
  const workspace = await workspaceRepository.findByIdSimple(workspaceId);
  if (!workspace) throw new AppError(404, 'Workspace not found');

  const member = await workspaceRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) {
    throw new AppError(403, 'You are not a member of this workspace');
  }

  const allowed = await hasPermission(workspaceId, userId, PERMISSIONS.REGENERATE_INVITE);
  if (!allowed) {
    throw new AppError(403, 'Insufficient permissions');
  }

  const crypto = await import('crypto');
  const newCode = crypto.randomUUID();

  return workspaceRepository.updateInviteCode(workspaceId, newCode);
};
