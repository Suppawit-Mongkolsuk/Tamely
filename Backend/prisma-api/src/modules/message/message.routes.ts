import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AuthRequest } from '../../types';
import { SendMessageSchema } from './message.model';
import * as messageService from './message.service';

const router = Router();
router.use(authenticate);

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

// GET /api/rooms/:roomId/messages
router.get('/rooms/:roomId/messages', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await messageService.getMessages(param(req.params.roomId), req.userId!, {
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    offset: req.query.offset ? Number(req.query.offset) : undefined,
    before: req.query.before as string | undefined,
  });
  res.json({ success: true, ...result });
}));

// POST /api/rooms/:roomId/messages
router.post('/rooms/:roomId/messages', validateRequest(SendMessageSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const msg = await messageService.sendMessage(param(req.params.roomId), req.userId!, req.body.content, req.body.type);
  res.status(201).json({ success: true, data: msg });
}));

// DELETE /api/messages/:id
router.delete('/messages/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await messageService.deleteMessage(param(req.params.id), req.userId!);
  res.json({ success: true, message: 'Message deleted' });
}));

export default router;
