import { prisma } from '../../index';
import { TypePayloadCreatePost, TypePayloadUpdatePost } from './post.model';

/* ======================= SELECTS ======================= */

const authorSelect = { id: true, Name: true, avatarUrl: true } as const;

/* ======================= WORKSPACE MEMBER ======================= */

export const findWorkspaceMember = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
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
    },
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true } },
    },
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
      include: {
        author: { select: authorSelect },
        _count: { select: { comments: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: options.limit,
      skip: options.offset,
    }),
    prisma.post.count({ where: { workspaceId } }),
  ]);

  return { posts, total };
};

export const findById = async (postId: string) => {
  return prisma.post.findUnique({ where: { id: postId } });
};

/* ======================= UPDATE ======================= */

export const update = async (postId: string, data: TypePayloadUpdatePost) => {
  return prisma.post.update({
    where: { id: postId },
    data,
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true } },
    },
  });
};

export const updatePin = async (postId: string, isPinned: boolean) => {
  return prisma.post.update({
    where: { id: postId },
    data: { isPinned },
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
      include: { user: { select: authorSelect } },
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
    include: { user: { select: authorSelect } },
  });
};

export const findCommentById = async (commentId: string) => {
  return prisma.postComment.findUnique({
    where: { id: commentId },
    include: { post: true },
  });
};

export const removeComment = async (commentId: string) => {
  return prisma.postComment.delete({ where: { id: commentId } });
};
