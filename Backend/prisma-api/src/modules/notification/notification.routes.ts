import { Router, Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AppError, AuthRequest } from '../../types';
import { MarkReadSchema, MarkAllReadSchema } from './notification.model';
import * as notificationService from './notification.service';
import { readRouteParam } from '../../utils/route.utils';

const router = Router();
router.use(authenticate);

// GET /api/workspaces/:wsId/notifications — ดึงรายการแจ้งเตือนของ user ใน workspace
router.get(
  '/workspaces/:wsId/notifications',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await notificationService.getNotifications(
      req.userId!,
      readRouteParam(req.params.wsId),
      {
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
        unreadOnly: req.query.unreadOnly === 'true',
      },
    );
    res.json({ success: true, ...result });
  }),
);

// PATCH /api/notifications/:id/read — อ่านแจ้งเตือนแล้ว
router.patch(
  '/notifications/:id/read',
  validateRequest(MarkReadSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await notificationService.markAsRead(readRouteParam(req.params.id), req.userId!);
    res.json({ success: true, message: 'Notification marked as read' });
  }),
);

// PATCH /api/workspaces/:wsId/notifications/read-all — อ่านทั้งหมดแล้ว
router.patch(
  '/workspaces/:wsId/notifications/read-all',
  validateRequest(MarkAllReadSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await notificationService.markAllAsRead(req.userId!, readRouteParam(req.params.wsId));
    res.json({ success: true, message: 'All notifications marked as read' });
  }),
);

export default router;
