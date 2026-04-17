import { Router } from 'express';
import { Response } from 'express';
import { MessageType } from '@prisma/client';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AuthRequest } from '../../types';
import { MarkRoomAsReadSchema, SendMessageSchema } from './message.model';
import * as messageService from './message.service';
import { uploadChatFile } from '../../utils/supabase-storage';
import { getIO } from '../chat/chat.gateway';
import { chatFileUpload } from '../../middlewares/upload.middleware';
import { readRouteParam } from '../../utils/route.utils';

const router = Router();
router.use(authenticate);

// GET /api/rooms/:roomId/messages
router.get('/rooms/:roomId/messages', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await messageService.getMessages(readRouteParam(req.params.roomId), req.userId!, {
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    offset: req.query.offset ? Number(req.query.offset) : undefined,
    before: req.query.before as string | undefined,
  });
  res.json({ success: true, ...result });
}));

// PATCH /api/rooms/:roomId/read
router.patch('/rooms/:roomId/read', validateRequest(MarkRoomAsReadSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await messageService.markAsRead(readRouteParam(req.params.roomId), req.userId!);
  res.json({ success: true, message: 'Room marked as read' });
}));

// POST /api/rooms/:roomId/messages
router.post('/rooms/:roomId/messages', validateRequest(SendMessageSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const roomId = readRouteParam(req.params.roomId);
  const msg = await messageService.sendMessage(roomId, req.userId!, req.body.content, req.body.type);

  // Broadcast ผ่าน Socket.IO (ครอบคลุมกรณี client ใช้ REST fallback)
  const io = getIO();
  if (io) io.to(roomId).emit('message_received', { ...msg, roomId });

  res.status(201).json({ success: true, data: msg });
}));

// POST /api/rooms/:roomId/upload
// อัปโหลดไฟล์/รูปภาพในห้องแชท (multipart/form-data)
router.post('/rooms/:roomId/upload', chatFileUpload.single('file'), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const roomId = readRouteParam(req.params.roomId);
  const file = req.file;

  if (!file) {
    res.status(400).json({ success: false, error: 'ไม่พบไฟล์ที่อัปโหลด' });
    return;
  }

  const isImage = file.mimetype.startsWith('image/');
  const msgType = isImage ? MessageType.IMAGE : MessageType.FILE;

  const fileUrl = await uploadChatFile(
    roomId,
    file.buffer,
    file.mimetype,
    file.originalname,
  );

  const content = req.body.content || (isImage ? '📷 รูปภาพ' : `📎 ${file.originalname}`);

  const message = await messageService.sendMessage(
    roomId,
    req.userId!,
    content,
    msgType,
    { fileUrl, fileName: file.originalname, fileSize: file.size },
  );

  const io = getIO();
  if (io) {
    io.to(roomId).emit('message_received', { ...message, roomId });
  }

  res.status(201).json({ success: true, data: message });
}));

// DELETE /api/messages/:id
router.delete('/messages/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await messageService.deleteMessage(readRouteParam(req.params.id), req.userId!);
  res.json({ success: true, message: 'Message deleted' });
}));

export default router;
