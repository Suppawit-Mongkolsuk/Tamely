import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import * as messageController from './message.controller';

const router = Router();

router.use(authenticate);

router.get('/rooms/:roomId/messages', messageController.list);
router.post('/rooms/:roomId/messages', messageController.send);
router.delete('/messages/:id', messageController.remove);

export default router;
