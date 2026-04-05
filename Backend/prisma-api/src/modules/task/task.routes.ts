import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import * as taskController from './task.controller';

const router = Router();

router.use(authenticate);

router.post('/workspaces/:wsId/tasks', taskController.create);
router.get('/workspaces/:wsId/tasks', taskController.list);
router.patch('/tasks/:id', taskController.update);
router.delete('/tasks/:id', taskController.remove);

export default router;
