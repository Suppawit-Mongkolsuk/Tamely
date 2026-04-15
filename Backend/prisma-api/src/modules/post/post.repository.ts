import { prisma } from '../../index';
import { TypePayloadCreatePost, TypePayloadUpdatePost } from './post.model';

/* ======================= SELECTS ======================= */

const authorSelect = { id: true, Name: true, avatarUrl: true } as const;
const postSelect = {
  id: true,
  title: true,
  body: true,
  isPinned: true,
  imageUrls: true,
  createdAt: true,
  author: { select: authorSelect },
  _count: { select: { comments: true } },
} as const;
const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  user: { select: authorSelect },
} as const;

/* ======================= WORKSPACE MEMBER ======================= */

export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { userId: true, role: true },
  });
};

export const findWorkspaceMemberWithUser = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: {
      userId: true,
      user: { select: { id: true, Name: true } },
    },
  });
};

/* ======================= CREATE ======================= */

export const create = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadCreatePost,
) => {
  return prisma.post.create({
    data: {
      workspaceId,
      authorId: userId,
      title: data.title,
      body: data.body,
      imageUrls: data.imageUrls ?? [],
    },
    select: postSelect,
  });
};

/* ======================= READ ======================= */

export const findMany = async (
  workspaceId: string,
  options: { limit: number; offset: number },
) => {
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { workspaceId },
      select: postSelect,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: options.limit,
      skip: options.offset,
    }),
    prisma.post.count({ where: { workspaceId } }),
  ]);

  return { posts, total };
};

export const findById = async (postId: string) => {
  return prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, workspaceId: true, authorId: true },
  });
};

/* ======================= UPDATE ======================= */

export const update = async (postId: string, data: TypePayloadUpdatePost) => {
  return prisma.post.update({
    where: { id: postId },
    data,
    select: postSelect,
  });
};

export const updatePin = async (postId: string, isPinned: boolean) => {
  return prisma.post.update({
    where: { id: postId },
    data: { isPinned },
    select: { id: true, isPinned: true },
  });
};

/* ======================= DELETE ======================= */

export const remove = async (postId: string) => {
  return prisma.post.delete({ where: { id: postId } });
};

/* ======================= COMMENTS ======================= */

export const findComments = async (
  postId: string,
  options: { limit: number; offset: number },
) => {
  const [comments, total] = await Promise.all([
    prisma.postComment.findMany({
      where: { postId },
      select: commentSelect,
      orderBy: { createdAt: 'asc' },
      take: options.limit,
      skip: options.offset,
    }),
    prisma.postComment.count({ where: { postId } }),
  ]);

  return { comments, total };
};

export const createComment = async (
  postId: string,
  userId: string,
  content: string,
) => {
  return prisma.postComment.create({
    data: { postId, userId, content },
    select: commentSelect,
  });
};

export const findCommentById = async (commentId: string) => {
  return prisma.postComment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      post: { select: { id: true, workspaceId: true } },
    },
  });
};

export const removeComment = async (commentId: string) => {
  return prisma.postComment.delete({ where: { id: commentId } });
};
