import { z } from 'zod';

const zodUuid = z
  .string()
  .uuid({ message: 'รูปแบบ UUID ไม่ถูกต้อง' })
  .transform((value) => value.trim());

export const HistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().max(4000),
});

export const AiChatPayloadSchema = z.object({
  message: z
    .string({ message: 'Message is required' })
    .trim()
    .min(1, 'Message is required')
    .max(2000),
  history: z.array(HistoryItemSchema).max(10).default([]),
});

export const AiChatSchema = z.object({
  params: z.object({
    wsId: zodUuid,
  }),
  body: AiChatPayloadSchema,
});

export type TypeAiChatPayload = z.infer<typeof AiChatPayloadSchema>;
export type TypeHistoryItem = z.infer<typeof HistoryItemSchema>;
