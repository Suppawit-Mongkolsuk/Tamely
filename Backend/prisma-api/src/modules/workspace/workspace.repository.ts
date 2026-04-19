import { prisma } from '../../index';
import { WorkspaceRole } from '@prisma/client';
import { TypePayloadCreateWorkspace, TypePayloadUpdateWorkspace } from './workspace.model';

/* ======================= SELECTS ======================= */

const ownerSelect = { id: true, Name: true, email: true, avatarUrl: true } as const;
const workspaceBaseSelect = {
  id: true,
  name: true,
  description: true,
  iconUrl: true,
  ownerId: true,
  inviteCode: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;
const workspaceWithOwnerSelect = { // รวมข้อมูล owner มาให้ด้วย
  ...workspaceBaseSelect, // เลือกข้อมูล workspace พื้นฐาน
  owner: { select: ownerSelect }, // เลือกข้อมูล owner
} as const;
const customRoleSelect = { // เลือกข้อมูล custom role permissions
  id: true,
  name: true,
  color: true,
  position: true,
  permissions: true,
} as const;
const memberUserSelect = { Name: true, email: true, avatarUrl: true, lastSeenAt: true } as const; // ข้อมูล user ที่จะแสดงในสมาชิก workspace 

/* ======================= CREATE ======================= */

export const create = async (
  ownerId: string,
  data: TypePayloadCreateWorkspace,
) => {
  return prisma.workspace.create({
    data: {
      name: data.name,
      description: data.description,
      iconUrl: data.iconUrl, 
      ownerId, // กำหนดเจ้าของ workspace เป็น user ที่ส่งเข้ามา
      members: { // สร้างความสสมาชิกไปเลยก็คือเจ้าของ
        create: { userId: ownerId, role: WorkspaceRole.OWNER }, // สร้าง membership สำหรับ owner ด้วย role OWNER
      },
    },
    select: workspaceWithOwnerSelect, // เลือกข้อมูล workspace พร้อมข้อมูล owner คืนกลับไป
  });
};

/* ======================= READ ======================= */

export const findMembershipsByUser = async (userId: string) => { // ดึงข้อมูล workspace memberships ของ user พร้อมข้อมูล workspace ที่เกี่ยวข้อง (เฉพาะ workspace ที่ active อยู่)
  return prisma.workspaceMember.findMany({
    where: {
      userId,
      workspace: { // กรองเฉพาะ workspace ที่ active อยู่
        isActive: true,
      },
    },
    select: { // เลือกข้อมูล membership พร้อมข้อมูล workspace ที่เกี่ยวข้อง
      role: true,
      joinedAt: true,
      workspace: {
        select: {
          ...workspaceBaseSelect, // เลือกข้อมูล workspace พื้นฐาน
          _count: { select: { members: true, rooms: true } }, // นับจำนวนสมาชิกและห้องใน workspace
        },
      },
    },
    orderBy: { joinedAt: 'desc' }, // เรียงตามวันที่เข้าร่วม workspace ล่าสุดก่อน
  });
};

export const findAssignedCustomRolePermissionsByUser = async (userId: string) => { // ดึงข้อมูล custom role permissions ที่ถูกกำหนดให้ user ใน workspace ต่างๆ (
  return prisma.customRoleMember.findMany({
    where: { userId },
    select: { // เลือกข้อมูล custom role permissions ที่ถูกกำหนดให้ user ใน workspace ต่างๆ
      workspaceId: true,
      customRole: {
        select: {
          permissions: true,
        },
      },
    },
  });
};

export const findById = async (workspaceId: string) => { // ดึงข้อมูล workspace โดย id พร้อมข้อมูล owner และนับจำนวนสมาชิก ห้อง และโพสต์ใน workspace นี้ด้วย
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      ...workspaceWithOwnerSelect,
      _count: { select: { members: true, rooms: true, posts: true } },
    },
  });
};

export const findByIdSimple = async (workspaceId: string) => { // ดึงข้อมูล workspace เฉพาะ id และ ownerId เพื่อใช้ในการตรวจสอบสิทธิ์การเข้าถึง workspace ใน service ชั้นบน 
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, ownerId: true },
  });
};

export const findByInviteCode = async (inviteCode: string) => { // ดึงข้อมูล workspace โดยใช้ invite code เฉพาะ workspace ที่ active อยู่เท่านั้น
  return prisma.workspace.findUnique({
    where: { inviteCode, isActive: true },
    select: workspaceBaseSelect,
  });
};

/* ======================= UPDATE ======================= */

export const update = async (
  workspaceId: string,
  data: TypePayloadUpdateWorkspace,
) => {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
    select: workspaceBaseSelect,
  });
};

export const updateInviteCode = async (workspaceId: string, newCode: string) => {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { inviteCode: newCode },
    select: { id: true, inviteCode: true },
  });
};

/* ======================= DELETE ======================= */

export const remove = async (workspaceId: string) => { // ลบ workspace 
  return prisma.workspace.delete({ where: { id: workspaceId } });
};

/* ======================= MEMBERS ======================= */

export const findWorkspaceMember = async (workspaceId: string, userId: string) => { // ดึงข้อมูล membership ของ user ใน workspace นี้ พร้อมตรวจสอบว่า workspace ยัง active อยู่หรือไม่ ถ้าไม่ active ให้คืนค่า null กลับไป
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { 
      userId: true, 
      role: true,
      workspace: { select: { isActive: true } },
    },
  });

  if (!member?.workspace.isActive) { // ถ้า workspace ไม่ active หรือไม่มี membership ให้คืนค่า null กลับไป
    return null;
  }

  return { // ถ้า workspace ยัง active อยู่ ให้คืนข้อมูล membership กลับไป
    userId: member.userId,
    role: member.role,
  };
};

export const findWorkspaceMemberDetailed = async (workspaceId: string, userId: string) => { // หา membership ของ user 
  const member = await prisma.workspaceMember.findUnique({ 
    where: { workspaceId_userId: { workspaceId, userId } },
    select: {
      userId: true,
      role: true,
      workspace: { select: { isActive: true } },
      user: {
        select: {
          customRoles: {
            where: { workspaceId },
            select: {
              customRole: {
                select: customRoleSelect,
              },
            },
          },
        },
      },
    },
  });

  if (!member?.workspace.isActive) { // ถ้า workspace ไม่ active หรือไม่มี membership ให้คืนค่า null กลับไป
    return null;
  }

  const { workspace, ...result } = member; // ถ้า workspace ยัง active อยู่ ให้คืนข้อมูล membership พร้อม custom role permissions กลับไป
  return result; // คืนข้อมูล membership พร้อม custom role permissions กลับไป
};

export const findAllMembers = async (workspaceId: string) => { // ดึงรายการสมาชิกใน workspace พร้อม role ของแต่ละคน 
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: {
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          ...memberUserSelect,
          customRoles: {
            where: { workspaceId },
            select: {
              customRole: {
                select: customRoleSelect,
              },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'asc' }, // เรียงตามวันที่เข้าร่วม workspace ก่อนหลัง
  });
};

export const createMember = async ( // เพิ่มสมาชิกใหม่เข้าไปใน workspace
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
) => {
  return prisma.workspaceMember.create({ // สร้าง membership ใหม่ให้กับ user ใน workspace นี้
    data: { workspaceId, userId, role }, // กำหนด workspaceId, userId และ role ของสมาชิกใหม่
    select: {
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: { // เลือกข้อมูล user ที่จะแสดงในสมาชิก workspace
          ...memberUserSelect, 
          customRoles: {// เลือกข้อมูล custom role permissions ที่จะแสดงในสมาชิก workspace
            where: { workspaceId }, 
            select: {
              customRole: {
                select: customRoleSelect, // เลือกข้อมูล custom role permissions ที่จะแสดงในสมาชิก workspace
              },
            },
          },
        },
      },
    },
  });
};

export const deleteMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
};

export const updateMemberRole = async (
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
) => {
  return prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId } },
    data: { role },
    select: {
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          ...memberUserSelect,
          customRoles: {
            where: { workspaceId },
            select: {
              customRole: {
                select: customRoleSelect,
              },
            },
          },
        },
      },
    },
  });
};
