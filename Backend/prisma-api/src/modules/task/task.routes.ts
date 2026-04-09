import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AuthRequest } from '../../types';
import { CreateTaskSchema } from './task.model';
import * as taskService from './task.service';

const router = Router();
router.use(authenticate);

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

// POST /api/workspaces/:wsId/tasks
router.post('/workspaces/:wsId/tasks', validateRequest(CreateTaskSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const task = await taskService.createTask(param(req.params.wsId), req.userId!, {
    workspaceId: param(req.params.wsId), ...req.body,
  });
  res.status(201).json({ success: true, data: task });
}));

// GET /api/workspaces/:wsId/tasks
router.get('/workspaces/:wsId/tasks', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const tasks = await taskService.getTasks(param(req.params.wsId), req.userId!, {
    month: req.query.month ? Number(req.query.month) : undefined,
    year: req.query.year ? Number(req.query.year) : undefined,
    status: req.query.status as string | undefined,
    priority: req.query.priority as string | undefined,
  });
  res.json({ success: true, data: tasks });
}));

// PATCH /api/tasks/:id
router.patch('/tasks/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const task = await taskService.updateTask(param(req.params.id), req.userId!, req.body);
  res.json({ success: true, data: task });
}));

// DELETE /api/tasks/:id
router.delete('/tasks/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await taskService.deleteTask(param(req.params.id), req.userId!);
  res.json({ success: true, message: 'Task deleted' });
}));

export default router;
