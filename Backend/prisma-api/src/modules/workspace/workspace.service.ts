import { WorkspaceRole } from '@prisma/client';
import { AppError } from '../../types';
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
  return workspaceRepository.create(ownerId, data);
};

/* ======================= READ ======================= */

export const getUserWorkspaces = async (userId: string) => {
  const memberships = await workspaceRepository.findMembershipsByUser(userId);

  return memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
    joinedAt: m.joinedAt,
    memberCount: m.workspace._count.members,
    roomCount: m.workspace._count.rooms,
  }));
};

export const getWorkspaceById = async (
  workspaceId: string,
  userId: string,
) => {
  const member = await workspaceRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new AppError(404, 'Workspace not found');

  return { ...workspace, role: member.role };
};

/* ======================= UPDATE ======================= */

export const updateWorkspace = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadUpdateWorkspace,
) => {
  const member = await workspaceRepository.findWorkspaceMember(workspaceId, userId);
  if (
    !member ||
    (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN)
  ) {
    throw new AppError(403, 'Only owner or admin can update workspace');
  }

  return workspaceRepository.update(workspaceId, data);
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

  return workspaceRepository.findAllMembers(workspaceId);
};

export const addMemberByEmail = async (
  workspaceId: string,
  requesterId: string,
  email: string,
  role: WorkspaceRole = WorkspaceRole.MEMBER,
) => {
  const requester = await workspaceRepository.findWorkspaceMember(workspaceId, requesterId);
  if (
    !requester ||
    (requester.role !== WorkspaceRole.OWNER &&
      requester.role !== WorkspaceRole.ADMIN)
  ) {
    throw new AppError(403, 'Only owner or admin can add members');
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

  return workspace;
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
    if (
      !requester ||
      (requester.role !== WorkspaceRole.OWNER &&
        requester.role !== WorkspaceRole.ADMIN)
    ) {
      throw new AppError(403, 'Only owner or admin can remove members');
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

  if (workspace.ownerId !== requesterId) {
    throw new AppError(403, 'Only the owner can change member roles');
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
  if (workspace.ownerId !== userId) {
    throw new AppError(403, 'Only the owner can regenerate the invite code');
  }

  const crypto = await import('crypto');
  const newCode = crypto.randomUUID();

  return workspaceRepository.updateInviteCode(workspaceId, newCode);
};
