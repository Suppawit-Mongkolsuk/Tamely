import { z } from "zod";
import { WorkspaceRole } from "@prisma/client";

/* ======================= TYPES ======================= */

export type TypePayloadCreateWorkspace = { 
  name: string;
  description?: string;
  iconUrl?: string;
};

export type TypePayloadUpdateWorkspace = {
  name?: string;
  description?: string;
  iconUrl?: string;
};

export type TypePayloadUpdateMemberRole = {
  role: WorkspaceRole;
};

/* ======================= HELPERS ======================= */

const zodUuid = z
  .string()
  .uuid({ message: "รูปแบบ UUID ไม่ถูกต้อง" })
  .transform((v) => v.trim());

/* ======================= CREATE ======================= */

export const CreateWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string({ message: "กรุณากรอกชื่อ Workspace" })
      .min(1, { message: "ชื่อ Workspace ต้องมีอย่างน้อย 1 ตัวอักษร" })
      .max(100, { message: "ชื่อ Workspace ต้องไม่เกิน 100 ตัวอักษร" })
      .transform((v) => v.trim()),
    description: z
      .string()
      .max(500, { message: "คำอธิบายต้องไม่เกิน 500 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
    iconUrl: z.string().url({ message: "URL ไม่ถูกต้อง" }).optional(),
  }),
});

/* ======================= UPDATE ======================= */

export const UpdateWorkspaceSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
  body: z.object({
    name: z
      .string()
      .min(1, { message: "ชื่อ Workspace ต้องมีอย่างน้อย 1 ตัวอักษร" })
      .max(100, { message: "ชื่อ Workspace ต้องไม่เกิน 100 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
    description: z
      .string()
      .max(500, { message: "คำอธิบายต้องไม่เกิน 500 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
    iconUrl: z.string().url({ message: "URL ไม่ถูกต้อง" }).optional(),
  }),
});

/* ======================= OTHER ======================= */

export const GetByIdSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});

export const DeleteWorkspaceSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});

export const JoinWorkspaceSchema = z.object({
  body: z.object({
    inviteCode: z
      .string({ message: "กรุณากรอก Invite Code" })
      .min(1, { message: "Invite Code ต้องมีอย่างน้อย 1 ตัวอักษร" })
      .transform((v) => v.trim()),
  }),
});

export const RemoveMemberSchema = z.object({
  params: z.object({
    id: zodUuid,
    userId: zodUuid,
  }),
});

export const UpdateMemberRoleSchema = z.object({
  params: z.object({
    id: zodUuid,
    userId: zodUuid,
  }),
  body: z.object({
    role: z.enum(["MEMBER", "MODERATOR", "ADMIN"], {
      message: "บทบาทไม่ถูกต้อง",
    }),
  }),
});

export const RegenerateInviteSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});

export const GetMembersSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});
