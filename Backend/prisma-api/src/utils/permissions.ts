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

export async function resolveUserPermissions(
  workspaceId: string,
  userId: string,
): Promise<Set<Permission>> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: {
      role: true,
      userId: true,
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

  if (!member) {
    return new Set<Permission>();
  }

  if (member.role === 'OWNER') {
    return new Set<Permission>(PERMISSION_VALUES);
  }

  const permissions = new Set<Permission>(BUILT_IN_ROLE_PERMISSIONS[member.role]);

  // เพิ่ม always-granted permissions ให้ทุกสมาชิก
  for (const p of ALWAYS_GRANTED) {
    permissions.add(p);
  }

  for (const assignedRole of member.user.customRoles) {
    for (const permission of assignedRole.customRole.permissions) {
      if (isPermission(permission)) {
        permissions.add(permission);
      }
    }
  }

  return permissions;
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
