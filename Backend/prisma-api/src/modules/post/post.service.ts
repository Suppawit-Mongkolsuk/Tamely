import { AppError } from '../../types';
import { PERMISSIONS } from '../../types/permissions';
import { hasPermission } from '../../utils/permissions';
import { assertWorkspaceMember } from '../../utils/workspace.helpers';
import { TypePayloadCreatePost, TypePayloadUpdatePost } from './post.model';
import * as postRepository from './post.repository';
import { processAndCreateMentionNotifications } from '../notification/notification.service';

/* ======================= CREATE ======================= */

export const createPost = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadCreatePost,
) => {
  await assertWorkspaceMember(workspaceId, userId);
  const allowed = await hasPermission(workspaceId, userId, PERMISSIONS.CREATE_POST);
  if (!allowed) {
    throw new AppError(403, 'Insufficient permissions');
  }

  const post = await postRepository.create(workspaceId, userId, data);

  // Process @mentions → สร้าง notification (ถ้ามีการ @ เท่านั้น)
  const memberWithUser = await postRepository.findWorkspaceMemberWithUser(workspaceId, userId);
  if (memberWithUser) {
    await processAndCreateMentionNotifications({
      workspaceId,
      senderId: userId,
      senderName: memberWithUser.user.Name,
      text: data.body,
      postId: post.id,
      context: 'post',
    }).catch((err) => {
      console.error('Failed to process mention notifications for post:', err);
    });
  }

  return post;
};

/* ======================= READ ======================= */

export const getPosts = async (
  workspaceId: string,
  userId: string,
  options: { limit?: number; offset?: number },
) => {
  await assertWorkspaceMember(workspaceId, userId);

  const limit = Math.min(options.limit ?? 20, 50);
  const offset = options.offset ?? 0;

  const { posts, total } = await postRepository.findMany(workspaceId, { limit, offset });

  return {
    data: posts.map((p) => ({ ...p, commentCount: p._count.comments })),
    total,
    limit,
    offset,
  };
};

/* ======================= UPDATE ======================= */

export const updatePost = async (
  postId: string,
  userId: string,
  data: TypePayloadUpdatePost,
) => {
  const post = await postRepository.findById(postId);
  if (!post) throw new AppError(404, 'Post not found');

  await assertWorkspaceMember(post.workspaceId, userId);

  if (
    post.authorId !== userId &&
    !(await hasPermission(post.workspaceId, userId, PERMISSIONS.EDIT_ANY_POST))
  ) {
    throw new AppError(403, 'Insufficient permissions');
  }

  return postRepository.update(postId, data);
};

/* ======================= DELETE ======================= */

export const deletePost = async (postId: string, userId: string) => {
  const post = await postRepository.findById(postId);
  if (!post) throw new AppError(404, 'Post not found');

  await assertWorkspaceMember(post.workspaceId, userId);

  if (
    post.authorId !== userId &&
    !(await hasPermission(post.workspaceId, userId, PERMISSIONS.DELETE_ANY_POST))
  ) {
    throw new AppError(403, 'Insufficient permissions');
  }

  await postRepository.remove(postId);
};

/* ======================= PIN ======================= */

export const togglePin = async (postId: string, userId: string, isPinned: boolean) => {
  const post = await postRepository.findById(postId);
  if (!post) throw new AppError(404, 'Post not found');

  await assertWorkspaceMember(post.workspaceId, userId);

  const allowed = await hasPermission(post.workspaceId, userId, PERMISSIONS.PIN_POST);
  if (!allowed) {
    throw new AppError(403, 'Insufficient permissions');
  }

  return postRepository.updatePin(postId, isPinned);
};

/* ======================= COMMENTS ======================= */

export const getComments = async (
  postId: string,
  userId: string,
  options: { limit?: number; offset?: number },
) => {
  const post = await postRepository.findById(postId);
  if (!post) throw new AppError(404, 'Post not found');

  await assertWorkspaceMember(post.workspaceId, userId);

  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;

  const { comments, total } = await postRepository.findComments(postId, { limit, offset });
  return { data: comments, total, limit, offset };
};

export const addComment = async (
  postId: string,
  userId: string,
  content: string,
) => {
  const post = await postRepository.findById(postId);
  if (!post) throw new AppError(404, 'Post not found');

  await assertWorkspaceMember(post.workspaceId, userId);

  const comment = await postRepository.createComment(postId, userId, content);

  // Process @mentions → สร้าง notification (ถ้ามีการ @ เท่านั้น)
  const memberWithUser = await postRepository.findWorkspaceMemberWithUser(post.workspaceId, userId);
  if (memberWithUser) {
    await processAndCreateMentionNotifications({
      workspaceId: post.workspaceId,
      senderId: userId,
      senderName: memberWithUser.user.Name,
      text: content,
      postId: post.id,
      commentId: comment.id,
      context: 'comment',
    }).catch((err) => {
      console.error('Failed to process mention notifications for comment:', err);
    });
  }

  return comment;
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await postRepository.findCommentById(commentId);
  if (!comment) throw new AppError(404, 'Comment not found');

  const member = await postRepository.findWorkspaceMember(comment.post.workspaceId, userId);

  if (
    comment.userId !== userId &&
    (!member ||
      !(await hasPermission(comment.post.workspaceId, userId, PERMISSIONS.DELETE_ANY_COMMENT)))
  ) {
    throw new AppError(403, 'Insufficient permissions');
  }

  await postRepository.removeComment(commentId);
};
