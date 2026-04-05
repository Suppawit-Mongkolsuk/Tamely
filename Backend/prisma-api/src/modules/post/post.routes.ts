import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import * as postController from './post.controller';

const router = Router();

router.use(authenticate);

router.post('/workspaces/:wsId/posts', postController.create);
router.get('/workspaces/:wsId/posts', postController.list);

router.patch('/posts/:id', postController.update);
router.delete('/posts/:id', postController.remove);
router.patch('/posts/:id/pin', postController.togglePin);

router.get('/posts/:id/comments', postController.getComments);
router.post('/posts/:id/comments', postController.addComment);
router.delete('/comments/:id', postController.deleteComment);

export default router;
