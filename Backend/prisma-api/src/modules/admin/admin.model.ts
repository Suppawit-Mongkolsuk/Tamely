import { z } from 'zod';

const zodUuid = z
  .string()
  .uuid({ message: 'รูปแบบ UUID ไม่ถูกต้อง' })
  .transform((value) => value.trim());

export const UpdateWorkspaceStatusSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
  body: z.object({
    isActive: z.boolean(),
    reason: z
      .string()
      .max(500, { message: 'เหตุผลต้องไม่เกิน 500 ตัวอักษร' })
      .transform((value) => value.trim())
      .optional(),
  }),
});

export const DeleteWorkspaceSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
  body: z.object({
    workspaceName: z
      .string({ message: 'กรุณากรอกชื่อ workspace เพื่อยืนยัน' })
      .min(1, { message: 'กรุณากรอกชื่อ workspace เพื่อยืนยัน' })
      .max(200, { message: 'ชื่อ workspace ยาวเกินไป' })
      .transform((value) => value.trim()),
    password: z
      .string({ message: 'กรุณากรอกรหัสผ่านแอดมิน' })
      .min(1, { message: 'กรุณากรอกรหัสผ่านแอดมิน' }),
    reason: z
      .string()
      .max(500, { message: 'เหตุผลต้องไม่เกิน 500 ตัวอักษร' })
      .transform((value) => value.trim())
      .optional(),
  }),
});
