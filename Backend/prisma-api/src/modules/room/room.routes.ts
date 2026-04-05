import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import * as roomController from './room.controller';

const router = Router();

router.use(authenticate);

router.post('/workspaces/:wsId/rooms', roomController.create);
router.get('/workspaces/:wsId/rooms', roomController.list);

router.get('/rooms/:id', roomController.getById);
router.patch('/rooms/:id', roomController.update);
router.delete('/rooms/:id', roomController.remove);

router.post('/rooms/:id/join', roomController.join);
router.post('/rooms/:id/members', roomController.addMember);
router.delete('/rooms/:id/members/:userId', roomController.removeMember);

export default router;
