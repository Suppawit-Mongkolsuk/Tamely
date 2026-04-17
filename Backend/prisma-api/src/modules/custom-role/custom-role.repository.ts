import { prisma } from '../../index';
import { AppError } from '../../types';
import {
  TypePayloadCreateCustomRole,
  TypePayloadUpdateCustomRole,
} from './custom-role.model';

const customRoleSelect = {
  id: true,
  workspaceId: true,
  name: true,
  color: true,
  position: true,
  permissions: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { userId: true, role: true },
  });
};

export const findMany = async (workspaceId: string) => {
  return prisma.customRole.findMany({
    where: { workspaceId },
    select: customRoleSelect,
    orderBy: [{ position: 'desc' }, { createdAt: 'asc' }],
  });
};

export const findById = async (workspaceId: string, roleId: string) => {
  return prisma.customRole.findFirst({
    where: { workspaceId, id: roleId },
    select: customRoleSelect,
  });
};

export const findMaxPosition = async (workspaceId: string) => {
  const role = await prisma.customRole.findFirst({
    where: { workspaceId },
    select: { position: true },
    orderBy: { position: 'desc' },
  });

  return role?.position ?? 0;
};

export const create = async (
  workspaceId: string,
  data: TypePayloadCreateCustomRole,
  position: number,
) => {
  return prisma.customRole.create({
    data: {
      workspaceId,
      name: data.name,
      color: data.color ?? '#6B7280',
      permissions: data.permissions ?? [],
      position,
    },
    select: customRoleSelect,
  });
};

export const update = async (
  workspaceId: string,
  roleId: string,
  data: TypePayloadUpdateCustomRole,
) => {
  const [updatedCount, updatedRole] = await prisma.$transaction([
    prisma.customRole.updateMany({
      where: { id: roleId, workspaceId },
      data,
    }),
    prisma.customRole.findFirst({
      where: { id: roleId, workspaceId },
      select: customRoleSelect,
    }),
  ]);

  if (updatedCount.count === 0 || !updatedRole) {
    throw new AppError(404, 'Custom role not found');
  }

  return updatedRole;
};

export const remove = async (workspaceId: string, roleId: string) => {
  const deleted = await prisma.customRole.deleteMany({
    where: { id: roleId, workspaceId },
  });
  if (deleted.count === 0) {
    throw new AppError(404, 'Custom role not found');
  }
};

export const reorder = async (workspaceId: string, roleIds: string[]) => {
  await prisma.$transaction(
    roleIds.map((roleId, index) =>
      prisma.customRole.updateMany({
        where: { id: roleId, workspaceId },
        data: { position: roleIds.length - index },
      }),
    ),
  );
};

export const findMemberCustomRoles = async (workspaceId: string, userId: string) => {
  return prisma.customRoleMember.findMany({
    where: { workspaceId, userId },
    select: {
      customRole: {
        select: customRoleSelect,
      },
    },
    orderBy: {
      customRole: {
        position: 'desc',
      },
    },
  });
};

export const assignRole = async (
  workspaceId: string,
  userId: string,
  roleId: string,
) => {
  return prisma.customRoleMember.create({
    data: {
      workspaceId,
      userId,
      customRoleId: roleId,
    },
  });
};

export const revokeRole = async (
  workspaceId: string,
  userId: string,
  roleId: string,
) => {
  return prisma.customRoleMember.deleteMany({
    where: { workspaceId, userId, customRoleId: roleId },
  });
};
