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

router.post(
  '/workspaces/:wsId/ai/chat',
  validateRequest(AiChatSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await aiService.processAiChat({
      workspaceId: param(req.params.wsId),
      userId: req.userId!,
      message: req.body.message,
      history: req.body.history ?? [],
    });

    res.json({ success: true, data: result });
  }),
);

export default router;
