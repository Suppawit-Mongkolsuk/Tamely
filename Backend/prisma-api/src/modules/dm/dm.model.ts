import { z } from 'zod';

/* ======================= TYPES ======================= */

export type TypePayloadSendDM = {
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
};

/* ======================= HELPERS ======================= */

const zodUuid = z
  .string()
  .uuid({ message: 'รูปแบบ UUID ไม่ถูกต้อง' })
  .transform((v) => v.trim());

/* ======================= SEND DM ======================= */

export const SendDMSchema = z.object({
  params: z.object({
    conversationId: zodUuid,
  }),
  body: z.object({
    content: z
      .string({ message: 'กรุณากรอกข้อความ' })
      .min(1, { message: 'ข้อความต้องมีอย่างน้อย 1 ตัวอักษร' })
      .max(4000, { message: 'ข้อความต้องไม่เกิน 4,000 ตัวอักษร' }),
  }),
});

/* ======================= OPEN / START CONVERSATION ======================= */

export const OpenConversationSchema = z.object({
  params: z.object({
    wsId: zodUuid,
  }),
  body: z.object({
    targetUserId: zodUuid,
  }),
});
