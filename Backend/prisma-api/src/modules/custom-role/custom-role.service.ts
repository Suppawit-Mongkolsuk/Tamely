import { AppError } from '../../types';
import { PERMISSIONS } from '../../types/permissions';
import { hasPermission } from '../../utils/permissions';
import {
  TypePayloadCreateCustomRole,
  TypePayloadUpdateCustomRole,
} from './custom-role.model';
import * as customRoleRepository from './custom-role.repository';

const BUILT_IN_ROLE_NAMES = new Set(['owner', 'admin', 'moderator', 'member']);

const assertWorkspaceMember = async (workspaceId: string, userId: string) => {
  const member = await customRoleRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');
  return member;
};

const assertManageRolesPermission = async (workspaceId: string, userId: string) => {
  await assertWorkspaceMember(workspaceId, userId);
  const allowed = await hasPermission(workspaceId, userId, PERMISSIONS.MANAGE_ROLES);
  if (!allowed) {
    throw new AppError(403, 'Insufficient permissions');
  }
};

const assertRoleNameAllowed = (name: string) => {
  if (BUILT_IN_ROLE_NAMES.has(name.trim().toLowerCase())) {
    throw new AppError(400, 'Cannot use a built-in role name for custom role');
  }
};

export const listCustomRoles = async (workspaceId: string, userId: string) => {
  await assertWorkspaceMember(workspaceId, userId);
  return customRoleRepository.findMany(workspaceId);
};

export const createCustomRole = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadCreateCustomRole,
) => {
  await assertManageRolesPermission(workspaceId, userId);
  assertRoleNameAllowed(data.name);

  const maxPosition = await customRoleRepository.findMaxPosition(workspaceId);
  return customRoleRepository.create(workspaceId, data, maxPosition + 1);
};

export const updateCustomRole = async (
  workspaceId: string,
  userId: string,
  roleId: string,
  data: TypePayloadUpdateCustomRole,
) => {
  await assertManageRolesPermission(workspaceId, userId);
  const existing = await customRoleRepository.findById(workspaceId, roleId);
  if (!existing) throw new AppError(404, 'Custom role not found');
  if (data.name) assertRoleNameAllowed(data.name);

  return customRoleRepository.update(workspaceId, roleId, data);
};

export const deleteCustomRole = async (
  workspaceId: string,
  userId: string,
  roleId: string,
) => {
  await assertManageRolesPermission(workspaceId, userId);
  const existing = await customRoleRepository.findById(workspaceId, roleId);
  if (!existing) throw new AppError(404, 'Custom role not found');
  await customRoleRepository.remove(workspaceId, roleId);
};

export const reorderCustomRoles = async (
  workspaceId: string,
  userId: string,
  roleIds: string[],
) => {
  await assertManageRolesPermission(workspaceId, userId);
  const roles = await customRoleRepository.findMany(workspaceId);
  const existingRoleIds = new Set(roles.map((role) => role.id));

  if (roleIds.length !== roles.length || roleIds.some((roleId) => !existingRoleIds.has(roleId))) {
    throw new AppError(400, 'roleIds must contain every role in the workspace exactly once');
  }

  await customRoleRepository.reorder(workspaceId, roleIds);
  return customRoleRepository.findMany(workspaceId);
};

export const getMemberCustomRoles = async (
  workspaceId: string,
  requesterId: string,
  userId: string,
) => {
  await assertWorkspaceMember(workspaceId, requesterId);
  await assertWorkspaceMember(workspaceId, userId);
  const roles = await customRoleRepository.findMemberCustomRoles(workspaceId, userId);
  return roles.map((item) => item.customRole);
};

export const assignCustomRole = async (
  workspaceId: string,
  requesterId: string,
  userId: string,
  roleId: string,
) => {
  await assertManageRolesPermission(workspaceId, requesterId);
  await assertWorkspaceMember(workspaceId, userId);
  const role = await customRoleRepository.findById(workspaceId, roleId);
  if (!role) throw new AppError(404, 'Custom role not found');

  await customRoleRepository.assignRole(workspaceId, userId, roleId);
};

export const revokeCustomRole = async (
  workspaceId: string,
  requesterId: string,
  userId: string,
  roleId: string,
) => {
  await assertManageRolesPermission(workspaceId, requesterId);
  await assertWorkspaceMember(workspaceId, userId);
  const role = await customRoleRepository.findById(workspaceId, roleId);
  if (!role) throw new AppError(404, 'Custom role not found');

  await customRoleRepository.revokeRole(workspaceId, userId, roleId);
};
