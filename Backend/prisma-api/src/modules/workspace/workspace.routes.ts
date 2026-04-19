import { Router } from 'express';
import { Response, Request, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { workspaceIconUpload } from '../../middlewares/upload.middleware';
import { AuthRequest } from '../../types';
import { CreateWorkspaceSchema, JoinWorkspaceSchema, AddMemberSchema } from './workspace.model';
import * as workspaceService from './workspace.service';

const router = Router();
router.use(authenticate);

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

// ป้องกัน spam สร้าง workspace: 20 ครั้ง/ชั่วโมง ต่อ IP
const createWorkspaceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'สร้าง workspace บ่อยเกินไป กรุณารอสักครู่' },
});

// ตรวจสอบว่า :id เป็น UUID format — ป้องกัน Prisma crash จาก invalid UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validateUUID = (req: Request, res: Response, next: NextFunction): void => {
  const id = param(req.params.id);
  if (!UUID_REGEX.test(id)) { // ถ้าไม่ใช่ UUID format ให้ตอบ error แทนที่จะปล่อยให้ Prisma crash
    res.status(400).json({ success: false, error: 'Invalid workspace ID format' });
    return;
  }
  next();
};

// POST /api/workspaces // สร้าง workspace ใหม่
router.post('/', createWorkspaceLimiter, validateRequest(CreateWorkspaceSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
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
router.get('/:id', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const workspace = await workspaceService.getWorkspaceById(param(req.params.id), req.userId!);
  res.json({ success: true, data: workspace });
}));

// PATCH /api/workspaces/:id
router.patch('/:id', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const workspace = await workspaceService.updateWorkspace(param(req.params.id), req.userId!, req.body);
  res.json({ success: true, data: workspace });
}));

// DELETE /api/workspaces/:id
router.delete('/:id', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await workspaceService.deleteWorkspace(param(req.params.id), req.userId!);
  res.json({ success: true, message: 'Workspace deleted' });
}));

// GET /api/workspaces/:id/members
router.get('/:id/members', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const members = await workspaceService.getMembers(param(req.params.id), req.userId!);
  res.json({ success: true, data: members });
}));

// POST /api/workspaces/:id/members
router.post('/:id/members', validateUUID, validateRequest(AddMemberSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await workspaceService.addMemberByEmail(param(req.params.id), req.userId!, req.body.email, req.body.role);
  res.status(201).json({ success: true, data: member });
}));

// DELETE /api/workspaces/:id/members/:userId
router.delete('/:id/members/:userId', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await workspaceService.removeMember(param(req.params.id), req.userId!, param(req.params.userId));
  res.json({ success: true, message: 'Member removed' });
}));

// PATCH /api/workspaces/:id/members/:userId
router.patch('/:id/members/:userId', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await workspaceService.updateMemberRole(param(req.params.id), req.userId!, param(req.params.userId), req.body);
  res.json({ success: true, data: member });
}));

// POST /api/workspaces/:id/regenerate-invite
router.post('/:id/regenerate-invite', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await workspaceService.regenerateInviteCode(param(req.params.id), req.userId!);
  res.json({ success: true, data: result });
}));

// POST /api/workspaces/:id/icon
router.post('/:id/icon', validateUUID, workspaceIconUpload.single('icon'), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const file = req.file;
  if (!file) { res.status(400).json({ success: false, error: 'No file uploaded' }); return; }
  const result = await workspaceService.updateWorkspaceIcon(
    param(req.params.id),
    req.userId!,
    file.buffer,
    file.mimetype,
    file.originalname,
  );
  res.json({ success: true, data: result });
}));

export default router;
