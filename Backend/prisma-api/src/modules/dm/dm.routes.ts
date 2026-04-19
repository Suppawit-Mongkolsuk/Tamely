import { Router } from 'express';
import { Response } from 'express';
import { MessageType } from '@prisma/client';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AuthRequest } from '../../types';
import { OpenConversationSchema, SendDMSchema } from './dm.model';
import * as dmService from './dm.service';
import { uploadChatFile } from '../../utils/supabase-storage';
import { getIO } from '../chat/chat.gateway';
import { chatFileUpload } from '../../middlewares/upload.middleware';

const router = Router();
router.use(authenticate);

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

// ================================================================
// CONVERSATIONS
// ================================================================

// POST /api/workspaces/:wsId/dm/open
// เปิด DM กับ user อีกคน (หรือ return conversation ที่มีอยู่แล้ว)
router.post(
  '/workspaces/:wsId/dm/open',
  validateRequest(OpenConversationSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const conv = await dmService.openConversation(
      param(req.params.wsId),
      req.userId!,
      req.body.targetUserId,
    );
    res.status(200).json({ success: true, data: conv });
  }),
);

// GET /api/workspaces/:wsId/dm
// ดึง list ของ DM conversations ทั้งหมดของ user ใน workspace
router.get(
  '/workspaces/:wsId/dm',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const convs = await dmService.getConversations(param(req.params.wsId), req.userId!);
    res.json({ success: true, data: convs });
  }),
);

// ================================================================
// MESSAGES
// ================================================================

// GET /api/dm/:conversationId/messages
// ดึงข้อความใน DM (pagination)
router.get(
  '/dm/:conversationId/messages',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const conversationId = param(req.params.conversationId);
    const result = await dmService.getMessages(
      conversationId,
      req.userId!,
      {
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
        before: req.query.before as string | undefined,
      },
    );

    // แจ้ง sender ว่าข้อความถูกอ่านแล้ว (real-time read receipt)
    const io = getIO();
    if (io) {
      io.to(`dm:${conversationId}`).emit('dm_read', {
        conversationId,
        readByUserId: req.userId,
      });
    }

    res.json({ success: true, ...result });
  }),
);

// POST /api/dm/:conversationId/messages
// ส่งข้อความใน DM
router.post(
  '/dm/:conversationId/messages',
  validateRequest(SendDMSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const conversationId = param(req.params.conversationId);
    const msg = await dmService.sendMessage(conversationId, req.userId!, req.body.content);

    // Broadcast ผ่าน Socket.IO (ครอบคลุมกรณี client ใช้ REST fallback)
    const io = getIO();
    if (io) io.to(`dm:${conversationId}`).emit('dm_received', msg);

    res.status(201).json({ success: true, data: msg });
  }),
);

// PATCH /api/dm/:conversationId/read
// Mark messages as read
router.patch(
  '/dm/:conversationId/read',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const conversationId = param(req.params.conversationId);
    await dmService.markAsRead(conversationId, req.userId!);

    // แจ้ง sender ว่าข้อความถูกอ่านแล้ว
    const io = getIO();
    if (io) {
      io.to(`dm:${conversationId}`).emit('dm_read', {
        conversationId,
        readByUserId: req.userId,
      });
    }

    res.json({ success: true, message: 'Marked as read' });
  }),
);

// POST /api/dm/:conversationId/upload
// อัปโหลดไฟล์/รูปภาพ ในแชท DM (multipart/form-data)
// รองรับทั้ง Web (fetch + FormData) และ Mobile (React Native FormData)
router.post(
  '/dm/:conversationId/upload',
  chatFileUpload.single('file'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const conversationId = param(req.params.conversationId);
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: 'ไม่พบไฟล์ที่อัปโหลด' });
      return;
    }

    // Determine type: IMAGE or FILE
    const isImage = file.mimetype.startsWith('image/');
    const msgType = isImage ? MessageType.IMAGE : MessageType.FILE;

    // Upload to Supabase Storage
    const fileUrl = await uploadChatFile(
      conversationId,
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    // Caption (optional text sent along with file)
    const content = req.body.content || (isImage ? '📷 รูปภาพ' : `📎 ${file.originalname}`);

    // Save message to DB
    const message = await dmService.sendMessage(
      conversationId,
      req.userId!,
      content,
      msgType,
      {
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
      },
    );

    // Broadcast ผ่าน Socket.IO ไปยังทุก client ในห้อง DM
    const io = getIO();
    if (io) {
      io.to(`dm:${conversationId}`).emit('dm_received', { ...message, conversationId });
    }

    res.status(201).json({ success: true, data: message });
  }),
);

// DELETE /api/dm/:conversationId/messages
// ลบข้อความทั้งหมดใน DM conversation (clear chat)
router.delete(
  '/dm/:conversationId/messages',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await dmService.clearMessages(param(req.params.conversationId), req.userId!);
    res.json({ success: true, message: 'Chat cleared' });
  }),
);

// DELETE /api/dm/messages/:messageId
// ลบข้อความ DM
router.delete(
  '/dm/messages/:messageId',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await dmService.deleteMessage(param(req.params.messageId), req.userId!);
    res.json({ success: true, message: 'Message deleted' });
  }),
);

export default router;
