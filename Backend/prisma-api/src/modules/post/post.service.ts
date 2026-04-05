import { prisma } from '../../index';
import { CreatePostPayload, UpdatePostPayload } from '../../types';
import { WorkspaceRole } from '@prisma/client';

const authorSelect = {
  id: true,
  Name: true,
  avatarUrl: true,
} as const;

const assertWorkspaceMember = async (workspaceId: string, userId: string) => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) throw new Error('You are not a member of this workspace');
  return member;
};

export const createPost = async (
  workspaceId: string,
  userId: string,
  data: CreatePostPayload,
) => {
  const member = await assertWorkspaceMember(workspaceId, userId);
  if (
    member.role !== WorkspaceRole.OWNER &&
    member.role !== WorkspaceRole.ADMIN
  ) {
    throw new Error('Only owner or admin can create posts');
  }

  return prisma.post.create({
    data: {
      workspaceId,
      authorId: userId,
      title: data.title,
      body: data.body,
    },
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true } },
    },
  });
};

export const getPosts = async (
  workspaceId: string,
  userId: string,
  options: { limit?: number; offset?: number },
) => {
  await assertWorkspaceMember(workspaceId, userId);

  const limit = Math.min(options.limit ?? 20, 50);
  const offset = options.offset ?? 0;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { workspaceId },
      include: {
        author: { select: authorSelect },
        _count: { select: { comments: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
    }),
    prisma.post.count({ where: { workspaceId } }),
  ]);

  return {
    data: posts.map((p) => ({ ...p, commentCount: p._count.comments })),
    total,
    limit,
    offset,
  };
};

export const updatePost = async (
  postId: string,
  userId: string,
  data: UpdatePostPayload,
) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: post.workspaceId, userId },
    },
  });
  if (!member) throw new Error('You are not a member of this workspace');

  if (
    post.authorId !== userId &&
    member.role !== WorkspaceRole.OWNER &&
    member.role !== WorkspaceRole.ADMIN
  ) {
    throw new Error('Only the author or admin can edit this post');
  }

  return prisma.post.update({
    where: { id: postId },
    data,
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true } },
    },
  });
};

export const deletePost = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: post.workspaceId, userId },
    },
  });
  if (!member) throw new Error('You are not a member of this workspace');

  if (
    post.authorId !== userId &&
    member.role !== WorkspaceRole.OWNER &&
    member.role !== WorkspaceRole.ADMIN
  ) {
    throw new Error('Only the author or admin can delete this post');
  }

  await prisma.post.delete({ where: { id: postId } });
};

export const togglePin = async (postId: string, userId: string, isPinned: boolean) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: post.workspaceId, userId },
    },
  });
  if (
    !member ||
    (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN)
  ) {
    throw new Error('Only owner or admin can pin/unpin posts');
  }

  return prisma.post.update({
    where: { id: postId },
    data: { isPinned },
  });
};

export const getComments = async (
  postId: string,
  userId: string,
  options: { limit?: number; offset?: number },
) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');

  await assertWorkspaceMember(post.workspaceId, userId);

  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;

  const [comments, total] = await Promise.all([
    prisma.postComment.findMany({
      where: { postId },
      include: { user: { select: authorSelect } },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.postComment.count({ where: { postId } }),
  ]);

  return { data: comments, total, limit, offset };
};

export const addComment = async (
  postId: string,
  userId: string,
  content: string,
) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found');

  await assertWorkspaceMember(post.workspaceId, userId);

  return prisma.postComment.create({
    data: { postId, userId, content },
    include: { user: { select: authorSelect } },
  });
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    include: { post: true },
  });
  if (!comment) throw new Error('Comment not found');

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: comment.post.workspaceId,
        userId,
      },
    },
  });

  if (
    comment.userId !== userId &&
    (!member ||
      (member.role !== WorkspaceRole.OWNER &&
        member.role !== WorkspaceRole.ADMIN))
  ) {
    throw new Error('Only the author or admin can delete this comment');
  }

  await prisma.postComment.delete({ where: { id: commentId } });
};
