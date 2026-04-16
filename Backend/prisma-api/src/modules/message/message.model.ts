import { z } from "zod";

/* ======================= TYPES ======================= */

export type TypePayloadSendMessage = {
  roomId: string;
  content: string;
  type?: string;
};

/* ======================= HELPERS ======================= */

const zodUuid = z
  .string()
  .uuid({ message: "รูปแบบ UUID ไม่ถูกต้อง" })
  .transform((v) => v.trim());

/* ======================= SEND MESSAGE ======================= */

export const SendMessageSchema = z.object({
  params: z.object({
    roomId: zodUuid,
  }),
  body: z.object({
    content: z
      .string({ message: "กรุณากรอกเนื้อหาข้อความ" })
      .min(1, { message: "ข้อความต้องมีอย่างน้อย 1 ตัวอักษร" })
      .transform((v) => v.trim()),
    type: z
      .enum(["TEXT", "IMAGE", "FILE", "SYSTEM"], {
        message: "ประเภทข้อความไม่ถูกต้อง",
      })
      .optional()
      .default("TEXT"),
  }),
});

/* ======================= LIST MESSAGES ======================= */

export const ListMessagesSchema = z.object({
  params: z.object({
    roomId: zodUuid,
  }),
  query: z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(50),
    offset: z.coerce.number().min(0).optional().default(0),
    before: z.string().optional(),
  }),
});

export const MarkRoomAsReadSchema = z.object({
  params: z.object({
    roomId: zodUuid,
  }),
});

/* ======================= DELETE MESSAGE ======================= */

export const DeleteMessageSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});
