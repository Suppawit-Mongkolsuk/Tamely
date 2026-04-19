import { WorkspaceRole } from '@prisma/client';
import { AppError } from '../../types';
import { PERMISSIONS } from '../../types/permissions';
import { buildPermissionArray, getUserPermissionsArray, hasPermission } from '../../utils/permissions';
import { assertWorkspaceActive } from '../../utils/workspace.helpers';
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
  ownerId: string, // userId ที่สร้าง workspace นี้ (จะถูกกำหนดเป็น owner)
  data: TypePayloadCreateWorkspace, // ข้อมูลสำหรับสร้าง workspace (เช่น name, description)
) => {
  const workspace = await workspaceRepository.create(ownerId, data);
  return { // คืนข้อมูล workspace ที่สร้างใหม่พร้อม role และ permissions ของ owner กลับไปเลย
    ...workspace,
    role: WorkspaceRole.OWNER,
    myPermissions: await getUserPermissionsArray(workspace.id, ownerId), // ดึง permissions ของ owner ใน workspace นี้
  };
};

/* ======================= READ ======================= */

export const getUserWorkspaces = async (userId: string) => {
  const [memberships, assignedCustomRoles] = await Promise.all([ // ดึงข้อมูล workspace memberships และ assigned custom roles ของ user 
    workspaceRepository.findMembershipsByUser(userId),
    workspaceRepository.findAssignedCustomRolePermissionsByUser(userId),
  ]);

  const permissionsByWorkspace = assignedCustomRoles.reduce<Map<string, string[][]>>( // เอา custom role permissions ทั้งหมดของ user มาจัดกลุ่มตาม workspace
    (map, assignment) => {
      const permissions = map.get(assignment.workspaceId) ?? []; // เช็คว่า workspace นี้มี permissions อยู่ใน map แล้วหรือยัง ถ้ายังไม่มีให้เริ่มต้นเป็น array ว่าง
      permissions.push(assignment.customRole.permissions); // เพิ่ม permissions ของ custom role
      map.set(assignment.workspaceId, permissions); // อัพเดต map ด้วย permissions ที่เพิ่มเข้ามา
      return map; // คืน map กลับไปในแต่ละรอบ
    },
    new Map(), // เริ่มต้นด้วย Map ว่างที่มี key เป็น workspaceId และ value เป็น array ของ permission arrays
    //Map {
          //"workspace1" => [permissions1, permissions2],
          //"workspace2" => [permissions3]
    //}
    
  );

  return memberships.map((m) => ({ //แปลง memberships ให้เป็นข้อมูลที่พร้อมส่งกลับรวมข้อมลู
    ...m.workspace, // กระจายข้อมูล workspace พื้นฐาน (id, name, description, iconUrl)
    role: m.role,
    joinedAt: m.joinedAt,
    memberCount: m.workspace._count.members,
    roomCount: m.workspace._count.rooms,
    myPermissions: buildPermissionArray( // สร้าง array ของ permissions ที่ user มีใน workspace นี้จาก role และ custom roles รวมกัน
      m.role, 
      permissionsByWorkspace.get(m.workspace.id) ?? [], 
    ),
  }));
};

export const getWorkspaceById = async ( // ดึงข้อมูล workspace โดย id พร้อมตรวจสอบว่า user เป็นสมาชิกอยู่หรือไม่
  workspaceId: string,
  userId: string,
) => {
  const member = await workspaceRepository.findWorkspaceMemberDetailed(workspaceId, userId); 
  if (!member) throw new AppError(403, 'You are not a member of this workspace'); // เช็คว่า user เป็นสมาชิกของ workspace นี้หรือไม่ ถ

  const workspace = await workspaceRepository.findById(workspaceId); // ดึงข้อมูล workspace โดย id พร้อมข้อมูล owner
  if (!workspace) throw new AppError(404, 'Workspace not found');
  if (!workspace.isActive) throw new AppError(423, 'Workspace is currently blocked by admin');

  return { // คืนข้อมูล workspace พร้อม role และ permissions ของ user กลับไป
    ...workspace,
    role: member.role,
    myPermissions: await getUserPermissionsArray(workspaceId, userId),
    myCustomRoles: (member as any).user.customRoles.map((item: any) => item.customRole), // ดึง custom roles ที่ user มีใน workspace นี้มาแสดงด้วย 
  };
};

/* ======================= UPDATE ======================= */

export const updateWorkspace = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadUpdateWorkspace,
) => {
  const member = await workspaceRepository.findWorkspaceMemberDetailed(workspaceId, userId);
  if (!member) { // ถ้า user ไม่ใช่สมาชิกของ workspace นี้ ให้แจ้งว่าไม่มีสิทธิ์ 
    throw new AppError(403, 'You are not a member of this workspace');
  }

  const allowed = await hasPermission(workspaceId, userId, PERMISSIONS.MANAGE_WORKSPACE); // เช็คว่า user มีสิทธิ์ในการจัดการ workspace นี้หรือไม่ (เช่น เปลี่ยนชื่อ, คำอธิบาย)
  if (!allowed) { // ถ้า user ไม่มีสิทธิ์ในการจัดการ workspace นี้ ให้แจ้งว่าไม่มีสิทธิ์
    throw new AppError(403, 'Insufficient permissions');
  }

  const updatedWorkspace = await workspaceRepository.update(workspaceId, data);// อัพเดตข้อมูล workspace ด้วยข้อมูลที่ส่งมา
  return { // คืนข้อมูล workspace ที่อัพเดตแล้วพร้อม role และ permissions ของ user กลับไป
    ...updatedWorkspace,
    role: member.role,
    myPermissions: await getUserPermissionsArray(workspaceId, userId),
    myCustomRoles: (member as any).user.customRoles.map((item: any) => item.customRole), // ดึง custom roles ที่ user มีใน workspace นี้มาแสดงด้วย
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
  if (!workspace) throw new AppError(404, 'Workspace not found'); // เช็คว่า workspace ที่จะลบมีอยู่จริงหรือไม่ ถ้าไม่มีให้แจ้งว่าไม่พบ workspace
  if (workspace.ownerId !== userId) { // เช็คว่า user ที่ส่งคำขอลบเป็น owner ของ workspace นี้หรือไม่ ถ้าไม่ใช่ owner ให้แจ้งว่าไม่มีสิทธิ์ลบ workspace
    throw new AppError(403, 'Only the owner can delete this workspace');
  }

  await workspaceRepository.remove(workspaceId); // ลบ workspace นี้ออกจาก database 
};

/* ======================= MEMBERS ======================= */

export const getMembers = async (workspaceId: string, userId: string) => { // ดึงรายการสมาชิกใน workspace พร้อม role ของแต่ละคน
  const member = await workspaceRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  const members = await workspaceRepository.findAllMembers(workspaceId);
  return members.map((workspaceMember) => ({ // แปลงข้อมูลสมาชิกแต่ละคนให้พร้อมส่ง กลับรวมข้อมูล
    ...workspaceMember,
  }));
};


export const joinByInviteCode = async ( // ให้ user เข้าร่วม workspace ด้วย invite code
  inviteCode: string,
  userId: string,
) => {
  const workspace = await workspaceRepository.findByInviteCode(inviteCode); // ดึง workspace ที่มี invite code ตรงกันและ active อยู่
  if (!workspace) throw new AppError(400, 'Invalid invite code');

  const existing = await workspaceRepository.findWorkspaceMember(workspace.id, userId); // เช็คว่า user นี้เป็นสมาชิกอยู่แล้วหรือยัง
  if (existing) throw new AppError(409, 'You are already a member'); // เช็คว่า user นี้เป็นสมาชิกอยู่แล้วหรือยัง ถ้าเป็นสมาชิกอยู่แล้วให้แจ้งว่าไม่สามารถเข้าร่วมได้

  await workspaceRepository.createMember(workspace.id, userId, WorkspaceRole.MEMBER); // เพิ่ม user นี้เข้าไปเป็นสมาชิกใน workspace ด้วย role เป็น MEMBER

  return { // คืนข้อมูล workspace ที่เข้าร่วมใหม่พร้อม role และ permissions ของ user กลับไป
    ...workspace,
    role: WorkspaceRole.MEMBER,
    myPermissions: await getUserPermissionsArray(workspace.id, userId),
  };
};

export const removeMember = async ( // ลบสมาชิกออกจาก workspace
  workspaceId: string,
  requesterId: string,
  targetUserId: string,
) => {
  const workspace = await workspaceRepository.findByIdSimple(workspaceId);// ดึงข้อมูล workspace เฉพาะ id และ ownerId เพื่อใช้ในการตรวจสอบ
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
  await assertWorkspaceActive(workspaceId);
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
