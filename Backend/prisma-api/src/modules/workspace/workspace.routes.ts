import { Router } from 'express';
import { Response, Request, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { workspaceIconUpload } from '../../middlewares/upload.middleware';
import { AuthRequest } from '../../types';
import { CreateWorkspaceSchema, JoinWorkspaceSchema } from './workspace.model';
import * as workspaceService from './workspace.service';

const router = Router();
router.use(authenticate);

const param = (value: string | string[] | undefined): string => // ฟังก์ชันช่วยอ่านค่า route param ที่อาจจะเป็น string หรือ array (กรณีที่มี param ซ้ำกันหลายค่า) และคืนค่าเป็น string เดียว (ถ้าเป็น array ให้เอาค่าตัวแรกมาใช้ ถ้าเป็น undefined ให้คืนเป็น empty string แทน)
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

// GET /api/workspaces // ดึงรายการ workspace ที่ user เป็นสมาชิกอยู่
router.get('/', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaces = await workspaceService.getUserWorkspaces(req.userId!); 
  res.json({ success: true, data: workspaces });
}));

// POST /api/workspaces/join // เข้าร่วม workspace ด้วย invite code
router.post('/join', validateRequest(JoinWorkspaceSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const workspace = await workspaceService.joinByInviteCode(req.body.inviteCode, req.userId!);
  res.json({ success: true, data: workspace });
}));

// GET /api/workspaces/:id // ดึงข้อมูล workspace โดย id พร้อมตรวจสอบว่า user เป็นสมาชิกอยู่หรือไม่
router.get('/:id', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const workspace = await workspaceService.getWorkspaceById(param(req.params.id), req.userId!);
  res.json({ success: true, data: workspace });
}));

// PATCH /api/workspaces/:id // อัพเดตข้อมูล workspace (เช่น ชื่อ, คำอธิบาย)
router.patch('/:id', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const workspace = await workspaceService.updateWorkspace(param(req.params.id), req.userId!, req.body);
  res.json({ success: true, data: workspace });
}));

// DELETE /api/workspaces/:id // ลบ workspace 
router.delete('/:id', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await workspaceService.deleteWorkspace(param(req.params.id), req.userId!);
  res.json({ success: true, message: 'Workspace deleted' });
}));

// GET /api/workspaces/:id/members // ดึงรายการสมาชิกใน workspace พร้อม role ของแต่ละคน
router.get('/:id/members', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const members = await workspaceService.getMembers(param(req.params.id), req.userId!);
  res.json({ success: true, data: members });
}));

// DELETE /api/workspaces/:id/members/:userId // ลบสมาชิกออกจาก workspace
router.delete('/:id/members/:userId', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await workspaceService.removeMember(param(req.params.id), req.userId!, param(req.params.userId));
  res.json({ success: true, message: 'Member removed' });
}));

// PATCH /api/workspaces/:id/members/:userId // อัพเดต role ของสมาชิกใน workspace (เช่น เปลี่ยนจาก member เป็น admin)
router.patch('/:id/members/:userId', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await workspaceService.updateMemberRole(param(req.params.id), req.userId!, param(req.params.userId), req.body);
  res.json({ success: true, data: member });
}));

// POST /api/workspaces/:id/regenerate-invite // สร้าง invite code ใหม่สำหรับ workspace 
router.post('/:id/regenerate-invite', validateUUID, asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await workspaceService.regenerateInviteCode(param(req.params.id), req.userId!);
  res.json({ success: true, data: result });
}));

// POST /api/workspaces/:id/icon // อัพโหลดหรือเปลี่ยนไอคอนของ workspace
router.post('/:id/icon', validateUUID, workspaceIconUpload.single('icon'), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const file = req.file; // ไฟล์ที่อัพโหลดมาจาก middleware
  if (!file) { res.status(400).json({ success: false, error: 'No file uploaded' }); return; } // ถ้าไม่มีไฟล์ให้ตอบ error กลับไป
  const result = await workspaceService.updateWorkspaceIcon( // อัพเดตไอคอนของ workspace 
    param(req.params.id),
    req.userId!,
    file.buffer,
    file.mimetype,
    file.originalname,
  );
  res.json({ success: true, data: result });
}));

export default router;
