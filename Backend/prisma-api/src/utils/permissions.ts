import { WorkspaceRole } from '@prisma/client';
import { prisma } from '../index';
import {
  BUILT_IN_ROLE_PERMISSIONS,
  isPermission,
  PERMISSIONS,
  PERMISSION_VALUES,
  type Permission,
} from '../types/permissions';

// สิทธิ์ที่ทุกสมาชิกได้เสมอ ไม่ว่าจะมียศอะไร
const ALWAYS_GRANTED: Permission[] = [
  PERMISSIONS.SEND_MESSAGES,
  PERMISSIONS.DELETE_OWN_MESSAGES,
  PERMISSIONS.USE_AI,
  PERMISSIONS.VIEW_PRIVATE_CHANNELS,
];

export function buildPermissionSet(
  role: WorkspaceRole,
  customRolePermissions: Iterable<readonly string[]>,
): Set<Permission> {
  if (role === WorkspaceRole.OWNER) {
    return new Set<Permission>(PERMISSION_VALUES);
  }

  const permissions = new Set<Permission>(BUILT_IN_ROLE_PERMISSIONS[role]);

  for (const permission of ALWAYS_GRANTED) {
    permissions.add(permission);
  }

  for (const assignedRolePermissions of customRolePermissions) {
    for (const permission of assignedRolePermissions) {
      if (isPermission(permission)) {
        permissions.add(permission);
      }
    }
  }

  return permissions;
}

export function buildPermissionArray(
  role: WorkspaceRole,
  customRolePermissions: Iterable<readonly string[]>,
): Permission[] {
  return Array.from(buildPermissionSet(role, customRolePermissions));
}

export async function resolveUserPermissions(
  workspaceId: string,
  userId: string,
): Promise<Set<Permission>> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: {
      role: true,
      userId: true,
      workspace: {
        select: {
          isActive: true,
        },
      },
      user: {
        select: {
          customRoles: {
            where: { workspaceId },
            select: {
              customRole: {
                select: {
                  permissions: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!member || !member.workspace.isActive) {
    return new Set<Permission>();
  }
  return buildPermissionSet(
    member.role,
    member.user.customRoles.map((assignedRole) => assignedRole.customRole.permissions),
  );
}

export async function hasPermission(
  workspaceId: string,
  userId: string,
  permission: Permission,
): Promise<boolean> {
  const permissions = await resolveUserPermissions(workspaceId, userId);
  return permissions.has(permission);
}

export async function hasAllPermissions(
  workspaceId: string,
  userId: string,
  permissions: Permission[],
): Promise<boolean> {
  const resolvedPermissions = await resolveUserPermissions(workspaceId, userId);
  return permissions.every((permission) => resolvedPermissions.has(permission));
}

export async function getUserPermissionsArray(
  workspaceId: string,
  userId: string,
): Promise<Permission[]> {
  return Array.from(await resolveUserPermissions(workspaceId, userId));
}
