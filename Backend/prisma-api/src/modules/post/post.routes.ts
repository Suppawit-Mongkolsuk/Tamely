import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AuthRequest } from '../../types';
import { CreatePostSchema, TogglePinSchema, AddCommentSchema } from './post.model';
import * as postService from './post.service';

const router = Router();
router.use(authenticate);

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

// POST /api/workspaces/:wsId/posts
router.post('/workspaces/:wsId/posts', validateRequest(CreatePostSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await postService.createPost(param(req.params.wsId), req.userId!, { workspaceId: param(req.params.wsId), ...req.body });
  res.status(201).json({ success: true, data: post });
}));

// GET /api/workspaces/:wsId/posts
router.get('/workspaces/:wsId/posts', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await postService.getPosts(param(req.params.wsId), req.userId!, {
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    offset: req.query.offset ? Number(req.query.offset) : undefined,
  });
  res.json({ success: true, ...result });
}));

// PATCH /api/posts/:id
router.patch('/posts/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await postService.updatePost(param(req.params.id), req.userId!, req.body);
  res.json({ success: true, data: post });
}));

// DELETE /api/posts/:id
router.delete('/posts/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await postService.deletePost(param(req.params.id), req.userId!);
  res.json({ success: true, message: 'Post deleted' });
}));

// PATCH /api/posts/:id/pin
router.patch('/posts/:id/pin', validateRequest(TogglePinSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await postService.togglePin(param(req.params.id), req.userId!, req.body.isPinned);
  res.json({ success: true, data: post });
}));

// GET /api/posts/:id/comments
router.get('/posts/:id/comments', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await postService.getComments(param(req.params.id), req.userId!, {
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    offset: req.query.offset ? Number(req.query.offset) : undefined,
  });
  res.json({ success: true, ...result });
}));

// POST /api/posts/:id/comments
router.post('/posts/:id/comments', validateRequest(AddCommentSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const comment = await postService.addComment(param(req.params.id), req.userId!, req.body.content);
  res.status(201).json({ success: true, data: comment });
}));

// DELETE /api/comments/:id
router.delete('/comments/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await postService.deleteComment(param(req.params.id), req.userId!);
  res.json({ success: true, message: 'Comment deleted' });
}));

export default router;
