import { z } from "zod";

/* ======================= HELPERS ======================= */

const zodUuid = z
  .string()
  .uuid({ message: "รูปแบบ UUID ไม่ถูกต้อง" })
  .transform((v) => v.trim());

/* ======================= LIST ======================= */

export const ListNotificationsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(50).optional().default(20),
    offset: z.coerce.number().min(0).optional().default(0),
    unreadOnly: z
      .enum(["true", "false"])
      .optional()
      .default("false")
      .transform((v) => v === "true"),
  }),
});

/* ======================= MARK READ ======================= */

export const MarkReadSchema = z.object({
  params: z.object({
    id: zodUuid,
  }),
});

/* ======================= MARK ALL READ ======================= */

export const MarkAllReadSchema = z.object({
  params: z.object({
    wsId: zodUuid,
  }),
});
