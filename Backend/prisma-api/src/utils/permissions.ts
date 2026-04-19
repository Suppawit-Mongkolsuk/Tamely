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

export function buildPermissionSet( // สร้างชุดสิทธิ์จากบทบาทและสิทธิ์ที่กำหนดเอง
  role: WorkspaceRole, // บทบาทของสมาชิก (OWNER, ADMIN, MEMBER)
  customRolePermissions: Iterable<readonly string[]>, // สิทธิ์ที่กำหนดเองจากบทบาทที่ผู้ใช้ได้รับมอบหมาย
): Set<Permission> { // บทบาท OWNER ได้สิทธิ์ทั้งหมดโดยไม่ต้องตรวจสอบ
  if (role === WorkspaceRole.OWNER) {
    return new Set<Permission>(PERMISSION_VALUES);
  }

  const permissions = new Set<Permission>(BUILT_IN_ROLE_PERMISSIONS[role]); // เริ่มต้นชุดสิทธิ์ด้วยสิทธิ์ที่มาพร้อมกับบทบาท

  for (const permission of ALWAYS_GRANTED) { //เพิ่มสิทธิ์
    permissions.add(permission);
  }

  for (const assignedRolePermissions of customRolePermissions) { // เพิ่มสิทธิ์ที่กำหนดเองจากบทบาทที่ผู้ใช้ได้รับมอบหมาย
    for (const permission of assignedRolePermissions) {
      if (isPermission(permission)) { // ตรวจสอบว่า permission ที่กำหนดเองเป็นค่าใน Permission หรือไม่ เพื่อป้องกันค่าที่ไม่ถูกต้อง
        permissions.add(permission); // ค่อยเพิ่ม
      }
    }
  }

  return permissions;
}

export function buildPermissionArray(  // สร้างอาเรย์สิทธิ์จากบทบาทและสิทธิ์ที่กำหนดเอง
  role: WorkspaceRole,  // บทบาทของสมาชิก (OWNER, ADMIN, MEMBER)
  customRolePermissions: Iterable<readonly string[]>, // สิทธิ์ที่กำหนดเองจากบทบาทที่ผู้ใช้ได้รับมอบหมาย
): Permission[] { 
  return Array.from(buildPermissionSet(role, customRolePermissions));
}

export async function resolveUserPermissions( // ดึงสิทธิ์ทั้งหมดของ user ใน workspace นั้น เเล้วรวมกับสิทธิ์ที่กำหนดเอง กับของระบบเข้าด้วยกัน
  workspaceId: string,
  userId: string,
): Promise<Set<Permission>> { 
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } }, // ค้นหาสมาชิกใน workspace ตาม workspaceId และ userId
    select: { // เลือกข้อมูลที่จำเป็นสำหรับการคำนวณสิทธิ์
      role: true, // โรลหลัก
      userId: true,
      workspace: {
        select: {
          isActive: true, // ตรวจสอบว่า workspace ยัง active อยู่หรือไม่
        },
      },
      user: { // ข้อมูลผู้ใช้
        select: {
          customRoles: { // บทบาทที่กำหนดเองที่ผู้ใช้ได้รับมอบหมาย
            where: { workspaceId },
            select: {
              customRole: {
                select: {
                  permissions: true, // สิทธิ์ที่กำหนดเองของบทบาท
                },
              },
            },
          },
        },
      },
    },
  });

  if (!member || !member.workspace.isActive) { // ถ้าไม่พบสมาชิกหรือ workspace ไม่ active ให้คืนเซ็ตว่าง
    return new Set<Permission>(); //
  }
  return buildPermissionSet( // สร้างชุดสิทธิ์จากบทบาทและสิทธิ์ที่กำหนดเองของสมาชิก
    member.role,
    member.user.customRoles.map((assignedRole) => assignedRole.customRole.permissions),
  );
}

export async function hasPermission( // ใช้เช็กว่า user มี permission ที่ต้องการไหม
  workspaceId: string,
  userId: string,
  permission: Permission,
): Promise<boolean> {
  const permissions = await resolveUserPermissions(workspaceId, userId); // ดึงสิทธิ์ทั้งหมดของ user ใน workspace นั้น
  return permissions.has(permission); // เช็กว่าเซ็ตสิทธิ์มี permission ที่ต้องการหรือไม่
}

export async function hasAllPermissions(
  workspaceId: string,
  userId: string,
  permissions: Permission[],
): Promise<boolean> {
  const resolvedPermissions = await resolveUserPermissions(workspaceId, userId);
  return permissions.every((permission) => resolvedPermissions.has(permission));
}

export async function getUserPermissionsArray( // ดึงสิทธิ์ทั้งหมดของ user ใน workspace นั้น เเล้วคืนเป็นอาเรย์
  workspaceId: string,
  userId: string,
): Promise<Permission[]> {
  return Array.from(await resolveUserPermissions(workspaceId, userId));
}
