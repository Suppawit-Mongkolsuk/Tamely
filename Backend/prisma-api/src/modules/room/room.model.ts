import { z } from "zod";

/* ======================= TYPES ======================= */

export type TypePayloadCreateRoom = {
  name: string;
  description?: string;
  isPrivate?: boolean;
  allowedRoles?: string[]; // ยศที่เข้าห้องได้ — ถ้าว่าง = ALL
};

export type TypePayloadUpdateRoom = {
  name?: string;
  description?: string;
  isPrivate?: boolean;
};

/* ======================= HELPERS ======================= */

const zodUuid = z
  .string()
  .uuid({ message: "รูปแบบ UUID ไม่ถูกต้อง" })
  .transform((v) => v.trim());

/* ======================= CREATE ======================= */

const WorkspaceRoleEnum = z.enum(['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']);

export const CreateRoomSchema = z.object({
  params: z.object({
    wsId: zodUuid,
  }),
  body: z.object({
    name: z
      .string({ message: "กรุณากรอกชื่อห้อง" })
      .min(1, { message: "ชื่อห้องต้องมีอย่างน้อย 1 ตัวอักษร" })
      .max(100, { message: "ชื่อห้องต้องไม่เกิน 100 ตัวอักษร" })
      .transform((v) => v.trim()),
    description: z
      .string()
      .max(500, { message: "คำอธิบายต้องไม่เกิน 500 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
    isPrivate: z.boolean().optional().default(false),
    allowedRoles: z.array(WorkspaceRoleEnum).optional().default([]),
  }),
});

/* ======================= UPDATE ======================= */

export const UpdateRoomSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
  body: z.object({
    name: z
      .string()
      .min(1, { message: "ชื่อห้องต้องมีอย่างน้อย 1 ตัวอักษร" })
      .max(100, { message: "ชื่อห้องต้องไม่เกิน 100 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
    description: z
      .string()
      .max(500, { message: "คำอธิบายต้องไม่เกิน 500 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
    isPrivate: z.boolean().optional(),
  }),
});

/* ======================= OTHER ======================= */

export const GetByIdSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});

export const DeleteRoomSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});

export const RoomIdSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});

export const AddMemberSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
  body: z.object({
    userId: zodUuid,
  }),
});

export const RemoveMemberSchema = z.object({
  params: z.object({
    id: zodUuid,
    userId: zodUuid,
  }),
});

export const ListRoomsSchema = z.object({
  params: z.object({
    wsId: zodUuid,
  }),
});
