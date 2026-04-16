import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AuthRequest } from '../../types';
import { CreateRoomSchema, UpdateRoomSchema, AddMemberSchema } from './room.model';
import * as roomService from './room.service';

const router = Router();
router.use(authenticate);

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

// POST /api/workspaces/:wsId/rooms
router.post('/workspaces/:wsId/rooms', validateRequest(CreateRoomSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const room = await roomService.createRoom(param(req.params.wsId), req.userId!, req.body);
  res.status(201).json({ success: true, data: room });
}));

// GET /api/workspaces/:wsId/rooms
router.get('/workspaces/:wsId/rooms', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const rooms = await roomService.getRooms(param(req.params.wsId), req.userId!);
  res.json({ success: true, data: rooms });
}));

// GET /api/workspaces/:wsId/management/rooms
router.get('/workspaces/:wsId/management/rooms', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const rooms = await roomService.getManagementRooms(param(req.params.wsId), req.userId!);
  res.json({ success: true, data: rooms });
}));

// GET /api/rooms/:id
router.get('/rooms/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const room = await roomService.getRoomById(param(req.params.id), req.userId!);
  res.json({ success: true, data: room });
}));

// PATCH /api/rooms/:id
router.patch('/rooms/:id', validateRequest(UpdateRoomSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const room = await roomService.updateRoom(param(req.params.id), req.userId!, req.body);
  res.json({ success: true, data: room });
}));

// DELETE /api/rooms/:id
router.delete('/rooms/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await roomService.deleteRoom(param(req.params.id), req.userId!);
  res.json({ success: true, message: 'Room deleted' });
}));

// POST /api/rooms/:id/join
router.post('/rooms/:id/join', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await roomService.joinRoom(param(req.params.id), req.userId!);
  res.json({ success: true, data: member });
}));

// POST /api/rooms/:id/members
router.post('/rooms/:id/members', validateRequest(AddMemberSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await roomService.addRoomMember(param(req.params.id), req.userId!, req.body.userId);
  res.status(201).json({ success: true, data: member });
}));

// DELETE /api/rooms/:id/members/:userId
router.delete('/rooms/:id/members/:userId', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await roomService.removeRoomMember(param(req.params.id), req.userId!, param(req.params.userId));
  res.json({ success: true, message: 'Member removed from room' });
}));

export default router;
