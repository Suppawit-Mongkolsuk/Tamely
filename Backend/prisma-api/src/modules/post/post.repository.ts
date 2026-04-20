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

export const findWorkspaceMember = async (workspaceId: string, userId: string) => { // ดึงข้อมูลสมาชิกใน workspace เพื่อใช้ในการตรวจสอบสิทธิ์การเข้าถึงโพสต์และคอมเมนต์ โดยจะคืนค่า userId และ role ของสมาชิกใน workspace นั้นๆ
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { userId: true, role: true },
  });
};

export const findWorkspaceMemberWithUser = async (workspaceId: string, userId: string) => { // ดึงข้อมลู user มาเเสดงเพื่อ @
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

export const findMany = async ( // ดึงรายการโพสต์ใน workspace พร้อมข้อมูลจำนวนคอมเมนต์
  workspaceId: string,
  options: { limit: number; offset: number }, // รับ parameter limit และ offset เพื่อใช้ในการแบ่งหน้า (pagination) ของผลลัพธ์โพสต์
) => {
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { workspaceId },
      select: postSelect,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }], // เรียงโพสต์ที่ปักหมุดไว้ก่อน แล้วค่อยเรียงตามวันที่สร้างจากใหม่ไปเก่า
      take: options.limit,
      skip: options.offset,
    }),
    prisma.post.count({ where: { workspaceId } }),
  ]);

  return { posts, total }; // คืนค่าโพสต์ที่ดึงมาและจำนวนโพสต์ทั้งหมดใน workspace เพื่อใช้ในการแสดงผลและการแบ่งหน้า (pagination)
};

export const findById = async (postId: string) => { // ดึงข้อมูลโพสต์ตาม id โดยจะรวม workspaceId และ authorId เพื่อใช้ในการตรวจสอบสิทธิ์
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
    select: postSelect, // คืนค่าโพสต์ที่ถูกแก้ไขแล้ว โดยใช้ postSelect เพื่อเลือกเฉพาะฟิลด์ที่ต้องการแสดงผล
  });
};

export const updatePin = async (postId: string, isPinned: boolean) => {
  return prisma.post.update({
    where: { id: postId },
    data: { isPinned },
    select: { id: true, isPinned: true }, // คืนค่าเฉพาะ id และสถานะ isPinned ของโพสต์ที่ถูกปักหมุดหรือยกเลิกปักหมุด
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
    prisma.postComment.findMany({ // ดึงรายการคอมเมนต์ของโพสต์ 
      where: { postId },
      select: commentSelect,
      orderBy: { createdAt: 'asc' },
      take: options.limit,
      skip: options.offset,
    }),
    prisma.postComment.count({ where: { postId } }), // นับจำนวนคอมเมนต์ทั้งหมดของโพสต์ 
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
