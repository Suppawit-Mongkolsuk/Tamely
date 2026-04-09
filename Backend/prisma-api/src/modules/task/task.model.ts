import { z } from "zod";

/* ======================= TYPES ======================= */

export type TypePayloadCreateTask = {
  workspaceId: string;
  title: string;
  description?: string;
  date: string;
  priority?: string;
  assigneeId?: string;
};

export type TypePayloadUpdateTask = {
  title?: string;
  description?: string;
  date?: string;
  priority?: string;
  status?: string;
  assigneeId?: string;
};

/* ======================= HELPERS ======================= */

const zodUuid = z
  .string()
  .uuid({ message: "รูปแบบ UUID ไม่ถูกต้อง" })
  .transform((v) => v.trim());

/* ======================= CREATE ======================= */

export const CreateTaskSchema = z.object({
  params: z.object({
    wsId: zodUuid,
  }),
  body: z.object({
    title: z
      .string({ message: "กรุณากรอกชื่อ Task" })
      .min(1, { message: "ชื่อ Task ต้องมีอย่างน้อย 1 ตัวอักษร" })
      .max(200, { message: "ชื่อ Task ต้องไม่เกิน 200 ตัวอักษร" })
      .transform((v) => v.trim()),
    description: z
      .string()
      .max(1000, { message: "คำอธิบายต้องไม่เกิน 1000 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
    date: z
      .string({ message: "กรุณาเลือกวันที่" })
      .min(1, { message: "กรุณาเลือกวันที่" })
      .transform((v) => v.trim()),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
        message: "ระดับความสำคัญไม่ถูกต้อง",
      })
      .optional()
      .default("MEDIUM"),
    assigneeId: zodUuid.optional(),
  }),
});

/* ======================= UPDATE ======================= */

export const UpdateTaskSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
  body: z.object({
    title: z
      .string()
      .min(1, { message: "ชื่อ Task ต้องมีอย่างน้อย 1 ตัวอักษร" })
      .max(200, { message: "ชื่อ Task ต้องไม่เกิน 200 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
    description: z
      .string()
      .max(1000, { message: "คำอธิบายต้องไม่เกิน 1000 ตัวอักษร" })
      .transform((v) => v.trim())
      .optional(),
    date: z.string().transform((v) => v.trim()).optional(),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
        message: "ระดับความสำคัญไม่ถูกต้อง",
      })
      .optional(),
    status: z
      .enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"], {
        message: "สถานะไม่ถูกต้อง",
      })
      .optional(),
    assigneeId: zodUuid.optional(),
  }),
});

/* ======================= OTHER ======================= */

export const DeleteTaskSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});

export const ListTasksSchema = z.object({
  params: z.object({
    wsId: zodUuid,
  }),
  query: z.object({
    month: z.coerce.number().min(1).max(12).optional(),
    year: z.coerce.number().min(2020).max(2100).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  }),
});
