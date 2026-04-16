import { Router, Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/validate';
import { AuthRequest } from '../../types';
import { prisma } from '../../index';

const router = Router();
router.use(authenticate);

/**
 * PATCH /api/users/push-token
 * mobile เรียกตอน app เปิดขึ้นมาเพื่อ register / update push token
 * body: { token: string }
 */
router.patch(
  '/users/push-token',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, error: 'token is required' });
      return;
    }

    await prisma.user.update({
      where: { id: req.userId! },
      data: { pushToken: token },
    });

    res.json({ success: true });
  }),
);

/**
 * DELETE /api/users/push-token
 * เรียกตอน logout เพื่อลบ token ออก ไม่ให้ส่ง push หลัง logout
 */
router.delete(
  '/users/push-token',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await prisma.user.update({
      where: { id: req.userId! },
      data: { pushToken: null },
    });

    res.json({ success: true });
  }),
);

export default router;