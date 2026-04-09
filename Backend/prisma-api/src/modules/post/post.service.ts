import { WorkspaceRole } from '@prisma/client';
import { AppError } from '../../types';
import { TypePayloadCreatePost, TypePayloadUpdatePost } from './post.model';
import * as postRepository from './post.repository';
import { processAndCreateMentionNotifications } from '../notification/notification.service';

/* ======================= HELPERS ======================= */

const assertWorkspaceMember = async (workspaceId: string, userId: string) => {
  const member = await postRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');
  return member;
};

/* ======================= CREATE ======================= */

export const createPost = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadCreatePost,
) => {
  const member = await assertWorkspaceMember(workspaceId, userId);
  if (
    member.role !== WorkspaceRole.OWNER &&
    member.role !== WorkspaceRole.ADMIN
  ) {
    throw new AppError(403, 'Only owner or admin can create posts');
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

  const member = await postRepository.findWorkspaceMember(post.workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  if (
    post.authorId !== userId &&
    member.role !== WorkspaceRole.OWNER &&
    member.role !== WorkspaceRole.ADMIN
  ) {
    throw new AppError(403, 'Only the author or admin can edit this post');
  }

  return postRepository.update(postId, data);
};

/* ======================= DELETE ======================= */

export const deletePost = async (postId: string, userId: string) => {
  const post = await postRepository.findById(postId);
  if (!post) throw new AppError(404, 'Post not found');

  const member = await postRepository.findWorkspaceMember(post.workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  if (
    post.authorId !== userId &&
    member.role !== WorkspaceRole.OWNER &&
    member.role !== WorkspaceRole.ADMIN
  ) {
    throw new AppError(403, 'Only the author or admin can delete this post');
  }

  await postRepository.remove(postId);
};

/* ======================= PIN ======================= */

export const togglePin = async (postId: string, userId: string, isPinned: boolean) => {
  const post = await postRepository.findById(postId);
  if (!post) throw new AppError(404, 'Post not found');

  const member = await postRepository.findWorkspaceMember(post.workspaceId, userId);
  if (
    !member ||
    (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN)
  ) {
    throw new AppError(403, 'Only owner or admin can pin/unpin posts');
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
      (member.role !== WorkspaceRole.OWNER &&
        member.role !== WorkspaceRole.ADMIN))
  ) {
    throw new AppError(403, 'Only the author or admin can delete this comment');
  }

  await postRepository.removeComment(commentId);
};
