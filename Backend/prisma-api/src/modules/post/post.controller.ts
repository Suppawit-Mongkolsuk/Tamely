import { Response } from 'express';
import { AuthRequest } from '../../types';
import * as postService from './post.service';

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

export const create = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { title, body } = req.body;
    if (!title || title.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Title is required.' });
      return;
    }
    if (!body || body.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Body is required.' });
      return;
    }

    const post = await postService.createPost(
      param(req.params.wsId),
      req.userId!,
      { workspaceId: param(req.params.wsId), title, body },
    );
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create post';
    res.status(400).json({ success: false, error: message });
  }
};

export const list = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await postService.getPosts(
      param(req.params.wsId),
      req.userId!,
      {
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      },
    );
    res.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to list posts';
    res.status(400).json({ success: false, error: message });
  }
};

export const update = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const post = await postService.updatePost(
      param(req.params.id),
      req.userId!,
      req.body,
    );
    res.json({ success: true, data: post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update post';
    res.status(403).json({ success: false, error: message });
  }
};

export const remove = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await postService.deletePost(param(req.params.id), req.userId!);
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete post';
    res.status(403).json({ success: false, error: message });
  }
};

export const togglePin = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { isPinned } = req.body;
    if (typeof isPinned !== 'boolean') {
      res.status(400).json({ success: false, error: 'isPinned (boolean) is required.' });
      return;
    }
    const post = await postService.togglePin(
      param(req.params.id),
      req.userId!,
      isPinned,
    );
    res.json({ success: true, data: post });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to pin/unpin post';
    res.status(403).json({ success: false, error: message });
  }
};

export const getComments = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await postService.getComments(
      param(req.params.id),
      req.userId!,
      {
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      },
    );
    res.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to get comments';
    res.status(400).json({ success: false, error: message });
  }
};

export const addComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Content is required.' });
      return;
    }

    const comment = await postService.addComment(
      param(req.params.id),
      req.userId!,
      content,
    );
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to add comment';
    res.status(400).json({ success: false, error: message });
  }
};

export const deleteComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await postService.deleteComment(param(req.params.id), req.userId!);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete comment';
    res.status(403).json({ success: false, error: message });
  }
};
