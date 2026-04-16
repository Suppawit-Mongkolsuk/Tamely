import { z } from 'zod';
import { PERMISSION_VALUES } from '../../types/permissions';

const zodUuid = z
  .string()
  .uuid({ message: 'รูปแบบ UUID ไม่ถูกต้อง' })
  .transform((value) => value.trim());

const PermissionEnum = z.enum(PERMISSION_VALUES as [string, ...string[]]);

export type TypePayloadCreateCustomRole = {
  name: string;
  color?: string;
  permissions?: string[];
};

export type TypePayloadUpdateCustomRole = {
  name?: string;
  color?: string;
  permissions?: string[];
};

export const ListCustomRolesSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});

export const CreateCustomRoleSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
  body: z.object({
    name: z
      .string({ message: 'กรุณากรอกชื่อยศ' })
      .min(1, { message: 'ชื่อยศต้องมีอย่างน้อย 1 ตัวอักษร' })
      .max(50, { message: 'ชื่อยศต้องไม่เกิน 50 ตัวอักษร' })
      .transform((value) => value.trim()),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'สีต้องเป็น hex color เช่น #6B7280' })
      .optional(),
    permissions: z.array(PermissionEnum).optional().default([]),
  }),
});

export const UpdateCustomRoleSchema = z.object({
  params: z.object({
    id: zodUuid,
    roleId: zodUuid,
  }),
  body: z.object({
    name: z
      .string()
      .min(1, { message: 'ชื่อยศต้องมีอย่างน้อย 1 ตัวอักษร' })
      .max(50, { message: 'ชื่อยศต้องไม่เกิน 50 ตัวอักษร' })
      .transform((value) => value.trim())
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'สีต้องเป็น hex color เช่น #6B7280' })
      .optional(),
    permissions: z.array(PermissionEnum).optional(),
  }),
});

export const DeleteCustomRoleSchema = z.object({
  params: z.object({
    id: zodUuid,
    roleId: zodUuid,
  }),
});

export const ReorderCustomRolesSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
  body: z.object({
    roleIds: z.array(zodUuid).min(1, { message: 'ต้องระบุ roleIds อย่างน้อย 1 รายการ' }),
  }),
});

export const MemberCustomRolesSchema = z.object({
  params: z.object({
    id: zodUuid,
    userId: zodUuid,
  }),
});

export const AssignCustomRoleSchema = z.object({
  params: z.object({
    id: zodUuid,
    userId: zodUuid,
  }),
  body: z.object({
    roleId: zodUuid,
  }),
});

export const RevokeCustomRoleSchema = z.object({
  params: z.object({
    id: zodUuid,
    userId: zodUuid,
    roleId: zodUuid,
  }),
});
