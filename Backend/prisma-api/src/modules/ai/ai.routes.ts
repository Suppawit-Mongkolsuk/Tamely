import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AuthRequest } from '../../types';
import { AiChatSchema } from './ai.model';
import * as aiService from './ai.service';

const router = Router();
router.use(authenticate);

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

// GET /api/workspaces/:wsId/ai/sessions // ดึงรายการ session ทั้งหมดของ user ใน workspace (รวม pinned ด้วย)
router.get(
  '/workspaces/:wsId/ai/sessions',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const sessions = await aiService.getSessionList(param(req.params.wsId), req.userId!);
    res.json({ success: true, data: sessions });
  }),
);

// GET /api/workspaces/:wsId/ai/sessions/:sessionId — messages ของ session
router.get(
  '/workspaces/:wsId/ai/sessions/:sessionId',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const messages = await aiService.getSessionMessages(
      param(req.params.wsId),
      req.userId!,
      param(req.params.sessionId),
    );
    res.json({ success: true, data: messages });
  }),
);

// PATCH /api/workspaces/:wsId/ai/sessions/ :sessionId — rename หรือ pin // unpin session
router.patch(
  '/workspaces/:wsId/ai/sessions/:sessionId',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, isPinned } = req.body as { title?: string; isPinned?: boolean }; // รับค่า title กับ isPinned จาก body เพื่อใช้ในการอัพเดต session นั้นๆ
    if (title !== undefined) { // ถ้ามี title ส่งมา แปลว่าต้องการเปลี่ยนชื่อ session นั้นๆ
      await aiService.renameSession(param(req.params.wsId), req.userId!, param(req.params.sessionId), title);
    }
    if (isPinned !== undefined) { // ถ้ามี isPinned ส่งมา แปลว่าต้องการเปลี่ยนสถานะ pinned ของ session นั้นๆ
      await aiService.togglePinSession(param(req.params.wsId), req.userId!, param(req.params.sessionId), isPinned);
    }
    res.json({ success: true });
  }),
);

// DELETE /api/workspaces/:wsId/ai/sessions/:sessionId
router.delete( // ลบ session นั้นๆ พร้อมกับข้อความทั้งหมดใน session นั้นๆ ด้วย
  '/workspaces/:wsId/ai/sessions/:sessionId',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await aiService.deleteSession(param(req.params.wsId), req.userId!, param(req.params.sessionId));
    res.json({ success: true });
  }),
);

// POST /api/workspaces/:wsId/ai/chat
router.post( // รับข้อความจาก user แล้วส่งไปประมวลผลกับ AI จากนั้นก็เก็บข้อความนั้นๆ ลง database พร้อมกับผลลัพธ์ที่ได้จาก AI ด้วย
  '/workspaces/:wsId/ai/chat',
  validateRequest(AiChatSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await aiService.processAiChat({
      workspaceId: param(req.params.wsId),
      userId: req.userId!,
      message: req.body.message,
      history: req.body.history ?? [],
      sessionId: req.body.sessionId,
    });

    res.json({ success: true, data: result });
  }),
);

export default router;
