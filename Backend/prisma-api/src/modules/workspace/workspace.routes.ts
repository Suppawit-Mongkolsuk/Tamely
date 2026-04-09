import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AuthRequest } from '../../types';
import { CreateWorkspaceSchema, JoinWorkspaceSchema, AddMemberSchema } from './workspace.model';
import * as workspaceService from './workspace.service';

const router = Router();
router.use(authenticate);

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

// POST /api/workspaces
router.post('/', validateRequest(CreateWorkspaceSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const workspace = await workspaceService.createWorkspace(req.userId!, req.body);
  res.status(201).json({ success: true, data: workspace });
}));

// GET /api/workspaces
router.get('/', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaces = await workspaceService.getUserWorkspaces(req.userId!);
  res.json({ success: true, data: workspaces });
}));

// POST /api/workspaces/join
router.post('/join', validateRequest(JoinWorkspaceSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const workspace = await workspaceService.joinByInviteCode(req.body.inviteCode, req.userId!);
  res.json({ success: true, data: workspace });
}));

// GET /api/workspaces/:id
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const workspace = await workspaceService.getWorkspaceById(param(req.params.id), req.userId!);
  res.json({ success: true, data: workspace });
}));

// PATCH /api/workspaces/:id
router.patch('/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const workspace = await workspaceService.updateWorkspace(param(req.params.id), req.userId!, req.body);
  res.json({ success: true, data: workspace });
}));

// DELETE /api/workspaces/:id
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await workspaceService.deleteWorkspace(param(req.params.id), req.userId!);
  res.json({ success: true, message: 'Workspace deleted' });
}));

// GET /api/workspaces/:id/members
router.get('/:id/members', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const members = await workspaceService.getMembers(param(req.params.id), req.userId!);
  res.json({ success: true, data: members });
}));

// POST /api/workspaces/:id/members
router.post('/:id/members', validateRequest(AddMemberSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await workspaceService.addMemberByEmail(param(req.params.id), req.userId!, req.body.email, req.body.role);
  res.status(201).json({ success: true, data: member });
}));

// DELETE /api/workspaces/:id/members/:userId
router.delete('/:id/members/:userId', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await workspaceService.removeMember(param(req.params.id), req.userId!, param(req.params.userId));
  res.json({ success: true, message: 'Member removed' });
}));

// PATCH /api/workspaces/:id/members/:userId
router.patch('/:id/members/:userId', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await workspaceService.updateMemberRole(param(req.params.id), req.userId!, param(req.params.userId), req.body);
  res.json({ success: true, data: member });
}));

// POST /api/workspaces/:id/regenerate-invite
router.post('/:id/regenerate-invite', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await workspaceService.regenerateInviteCode(param(req.params.id), req.userId!);
  res.json({ success: true, data: result });
}));

export default router;
