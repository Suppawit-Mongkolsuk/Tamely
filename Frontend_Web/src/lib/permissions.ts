import type { Workspace, WorkspacePermission } from '@/types';

export const PERMISSIONS = {
  MANAGE_WORKSPACE: 'MANAGE_WORKSPACE',
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_MEMBERS: 'MANAGE_MEMBERS',
  REGENERATE_INVITE: 'REGENERATE_INVITE',
  MANAGE_CHANNELS: 'MANAGE_CHANNELS',
  VIEW_PRIVATE_CHANNELS: 'VIEW_PRIVATE_CHANNELS',
  SEND_MESSAGES: 'SEND_MESSAGES',
  DELETE_OWN_MESSAGES: 'DELETE_OWN_MESSAGES',
  DELETE_ANY_MESSAGE: 'DELETE_ANY_MESSAGE',
  CREATE_POST: 'CREATE_POST',
  DELETE_ANY_POST: 'DELETE_ANY_POST',
  PIN_POST: 'PIN_POST',
  DELETE_ANY_COMMENT: 'DELETE_ANY_COMMENT',
  CREATE_TASK: 'CREATE_TASK',
  ASSIGN_TASK: 'ASSIGN_TASK',
  DELETE_ANY_TASK: 'DELETE_ANY_TASK',
  USE_AI: 'USE_AI',
  MENTION_ROLE: 'MENTION_ROLE',
} as const;

export type Permission = WorkspacePermission;

// VIEW_PRIVATE_CHANNELS, SEND_MESSAGES, DELETE_OWN_MESSAGES, USE_AI
// ไม่แสดงในหน้าสร้างยศ เพราะทุกยศมีสิทธิ์เหล่านี้อยู่แล้ว
export const PERMISSION_OPTIONS: Array<{ value: Permission; label: string }> = [
  { value: PERMISSIONS.MANAGE_WORKSPACE, label: 'จัดการ workspace' },
  { value: PERMISSIONS.MANAGE_ROLES, label: 'จัดการยศและสิทธิ์' },
  { value: PERMISSIONS.MANAGE_MEMBERS, label: 'จัดการสมาชิก' },
  { value: PERMISSIONS.REGENERATE_INVITE, label: 'สร้าง invite code ใหม่' },
  { value: PERMISSIONS.MANAGE_CHANNELS, label: 'จัดการห้อง' },
  { value: PERMISSIONS.DELETE_ANY_MESSAGE, label: 'ลบข้อความผู้อื่น' },
  { value: PERMISSIONS.CREATE_POST, label: 'สร้างโพสต์' },
  { value: PERMISSIONS.DELETE_ANY_POST, label: 'ลบโพสต์ผู้อื่น' },
  { value: PERMISSIONS.PIN_POST, label: 'ปักหมุดโพสต์' },
  { value: PERMISSIONS.DELETE_ANY_COMMENT, label: 'ลบคอมเมนต์ผู้อื่น' },
  { value: PERMISSIONS.CREATE_TASK, label: 'สร้าง task' },
  { value: PERMISSIONS.ASSIGN_TASK, label: 'มอบหมาย task' },
  { value: PERMISSIONS.DELETE_ANY_TASK, label: 'ลบ task ผู้อื่น' },
  { value: PERMISSIONS.MENTION_ROLE, label: '@ mention ยศ' },
];

export function canDo(
  workspace: Workspace | null | undefined,
  permission: Permission,
): boolean {
  return Boolean(workspace?.myPermissions?.includes(permission));
}

export function canAny(
  workspace: Workspace | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => canDo(workspace, permission));
}
