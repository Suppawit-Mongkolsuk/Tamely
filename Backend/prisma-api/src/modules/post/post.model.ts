import { z } from "zod";

/* ======================= TYPES ======================= */

export type TypePayloadCreatePost = {
  workspaceId: string;
  title: string;
  body: string;
  imageUrls?: string[];
};

export type TypePayloadUpdatePost = {
  title?: string;
  body?: string;
  imageUrls?: string[];
};

/* ======================= HELPERS ======================= */

const zodUuid = z
  .string()
  .uuid({ message: "รูปแบบ UUID ไม่ถูกต้อง" })
  .transform((v) => v.trim());

/* ======================= CREATE ======================= */

export const CreatePostSchema = z.object({
  params: z.object({
    wsId: zodUuid,
  }),
  body: z.object({
    title: z
      .string({ message: "กรุณากรอกหัวข้อโพสต์" })
      .min(1, { message: "หัวข้อต้องมีอย่างน้อย 1 ตัวอักษร" })
      .max(200, { message: "หัวข้อต้องไม่เกิน 200 ตัวอักษร" })
      .transform((v) => v.trim()),
    body: z
      .string({ message: "กรุณากรอกเนื้อหาโพสต์" })
      .min(1, { message: "เนื้อหาต้องมีอย่างน้อย 1 ตัวอักษร" })
      .transform((v) => v.trim()),
    imageUrls: z
      .array(z.string().url({ message: "URL รูปภาพไม่ถูกต้อง" }))
      .max(10, { message: "แนบรูปได้ไม่เกิน 10 รูป" })
      .optional()
      .default([]),
  }),
});

/* ======================= UPDATE ======================= */

export const UpdatePostSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
  body: z.object({
    title: z
      .string()
      .min(1, { message: "หัวข้อต้องมีอย่างน้อย 1 ตัวอักษร" })
      .max(200, { message: "หัวข้อต้องไม่เกิน 200 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
    body: z
      .string()
      .min(1, { message: "เนื้อหาต้องมีอย่างน้อย 1 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
    imageUrls: z
      .array(z.string().url({ message: "URL รูปภาพไม่ถูกต้อง" }))
      .max(10, { message: "แนบรูปได้ไม่เกิน 10 รูป" })
      .optional(),
  }),
});

/* ======================= DELETE ======================= */

export const DeletePostSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});

/* ======================= PIN ======================= */

export const TogglePinSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
  body: z.object({
    isPinned: z.boolean({ message: "กรุณาระบุค่า isPinned (true/false)" }),
  }),
});

/* ======================= LIST ======================= */

export const ListPostsSchema = z.object({
  params: z.object({
    wsId: zodUuid,
  }),
  query: z.object({
    limit: z.coerce.number().min(1).max(50).optional().default(20),
    offset: z.coerce.number().min(0).optional().default(0),
  }),
});

/* ======================= COMMENTS ======================= */

export const GetCommentsSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
  query: z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(50),
    offset: z.coerce.number().min(0).optional().default(0),
  }),
});

export const AddCommentSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
  body: z.object({
    content: z
      .string({ message: "กรุณากรอกเนื้อหาคอมเมนต์" })
      .min(1, { message: "คอมเมนต์ต้องมีอย่างน้อย 1 ตัวอักษร" })
      .max(2000, { message: "คอมเมนต์ต้องไม่เกิน 2000 ตัวอักษร" })
      .transform((v) => v.trim()),
  }),
});

export const DeleteCommentSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});
