import { Router, Response } from 'express';
import { authenticateAdmin } from '../../middlewares/auth';
import { asyncHandler, validateRequest } from '../../middlewares/validate';
import { clearAdminTokenCookie } from '../../utils/jwt.utils';
import { AuthRequest } from '../../types';
import { DeleteWorkspaceSchema, UpdateWorkspaceStatusSchema } from './admin.model';
import * as adminService from './admin.service';

const router = Router();

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

router.post('/logout', (_req: AuthRequest, res: Response): void => {
  clearAdminTokenCookie(res);
  res.json({ success: true, message: 'Admin logged out successfully' });
});

router.get(
  '/me',
  authenticateAdmin,
  asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
    const admin = await adminService.getAdminSession();
    res.json({ success: true, data: admin });
  }),
);

router.get(
  '/workspaces',
  authenticateAdmin,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const range =
      req.query.range === '7d' || req.query.range === '30d' || req.query.range === 'all'
        ? req.query.range
        : 'all';
    const dashboard = await adminService.getWorkspaceDashboard(range);
    res.json({ success: true, data: dashboard });
  }),
);

router.patch(
  '/workspaces/:id/status',
  authenticateAdmin,
  validateRequest(UpdateWorkspaceStatusSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const workspace = await adminService.updateWorkspaceStatus(
      param(req.params.id),
      req.body.isActive,
      req.adminUsername!,
      req.body.reason,
    );
    res.json({ success: true, data: workspace });
  }),
);

router.post(
  '/workspaces/:id/delete',
  authenticateAdmin,
  validateRequest(DeleteWorkspaceSchema),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await adminService.deleteWorkspaceAsAdmin({
      workspaceId: param(req.params.id),
      workspaceName: req.body.workspaceName,
      password: req.body.password,
      adminUsername: req.adminUsername!,
      reason: req.body.reason,
    });
    res.json({ success: true, data: result });
  }),
);

export default router;
