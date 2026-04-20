import { AppError } from '../../types';
import { PERMISSIONS } from '../../types/permissions';
import { hasPermission } from '../../utils/permissions';
import { assertWorkspaceMember } from '../../utils/workspace.helpers';
import { TypePayloadCreatePost, TypePayloadUpdatePost } from './post.model';
import * as postRepository from './post.repository';
import { processAndCreateMentionNotifications } from '../notification/notification.service';

/* ======================= CREATE ======================= */

export const createPost = async ( // สร้างโพสต์ใหม่ใน workspace
  workspaceId: string,
  userId: string,
  data: TypePayloadCreatePost,
) => {
  await assertWorkspaceMember(workspaceId, userId);  // ตรวจสอบว่า user เป็นสมาชิกของ workspace หรือไม่ และตรวจสอบว่า workspace ยัง active อยู่หรือไม่
  const allowed = await hasPermission(workspaceId, userId, PERMISSIONS.CREATE_POST); // ตรวจสอบว่า user มีสิทธิ์ในการสร้างโพสต์หรือไม่
  if (!allowed) {
    throw new AppError(403, 'Insufficient permissions'); 
  }

  const post = await postRepository.create(workspaceId, userId, data); // สร้างโพสต์ใหม่ใน workspace

  // Process @mentions → สร้าง notification (ถ้ามีการ @ เท่านั้น)
  const memberWithUser = await postRepository.findWorkspaceMemberWithUser(workspaceId, userId); // ดึงข้อมูลสมาชิกใน workspace พร้อมข้อมูล user ตาม workspaceId และ userId เพื่อใช้ในการสร้าง notification (ถ้ามีการ @)
  if (memberWithUser) { //เช็คถ้ามีการ @ ในข้อความโพสต์หรือไม่ ถ้ามีให้สร้าง notification
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

export const getPosts = async (  // ดึงรายการโพสต์ใน workspace พร้อมข้อมูลจำนวนคอมเมนต์ (ถ้ามี)
  workspaceId: string,
  userId: string,
  options: { limit?: number; offset?: number },
) => {
  await assertWorkspaceMember(workspaceId, userId); //เช็คว่า user เป็นสมาชิกของ workspace หรือไม่ 

  const limit = Math.min(options.limit ?? 20, 50); // จำกัดจำนวนโพสต์ที่ดึงมาได้สูงสุดไม่เกิน 50 โพสต์ต่อครั้ง
  const offset = options.offset ?? 0; // กำหนดค่าเริ่มต้นของ offset เป็น 0 ถ้าไม่ได้รับค่ามา เพื่อใช้ในการแบ่งหน้า (pagination) ของผลลัพธ์โพสต์

  const { posts, total } = await postRepository.findMany(workspaceId, { limit, offset }); // ดึงรายการโพสต์ใน workspace พร้อมข้อมูลจำนวนคอมเมนต์ 
  return {
    data: posts.map((p) => ({ ...p, commentCount: p._count.comments })), // แปลงข้อมูลโพสต์ที่ดึงมาให้รวมจำนวนคอมเมนต์ในแต่ละโพสต์ด้วย โดยใช้ _count.comments
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
  if (!post) throw new AppError(404, 'Post not found'); // ตรวจสอบว่าโพสต์ที่ต้องการแก้ไขมีอยู่จริงหรือไม่ ถ้าไม่มีให้ส่ง error 404

  await assertWorkspaceMember(post.workspaceId, userId); 

  if (
    post.authorId !== userId && 
    !(await hasPermission(post.workspaceId, userId, PERMISSIONS.EDIT_ANY_POST)) // ตรวจสอบว่า user เป็นผู้เขียนโพสต์หรือไม่ ถ้าไม่ใช่ให้ตรวจสอบว่ามีสิทธิ์ในการแก้ไขโพสต์ของคนอื่นหรือไม่ ถ้าไม่มีทั้งสองอย่างนี้จะไม่สามารถแก้ไขโพสต์ได้
  ) {
    throw new AppError(403, 'Insufficient permissions');
  }

  return postRepository.update(postId, data); // เรียกใช้ฟังก์ชัน update ใน postRepository เพื่อทำการแก้ไขโพสต์ตามข้อมูลที่ได้รับมา
};

/* ======================= DELETE ======================= */

export const deletePost = async (postId: string, userId: string) => {
  const post = await postRepository.findById(postId); // ตรวจสอบว่าโพสต์ที่ต้องการลบมีอยู่จริงหรือไม่ 
  if (!post) throw new AppError(404, 'Post not found');

  await assertWorkspaceMember(post.workspaceId, userId);

  if (
    post.authorId !== userId &&
    !(await hasPermission(post.workspaceId, userId, PERMISSIONS.DELETE_ANY_POST))
  ) {
    throw new AppError(403, 'Insufficient permissions');
  }

  await postRepository.remove(postId); // เรียกใช้ฟังก์ชัน remove ใน postRepository เพื่อทำการลบโพสต์ตาม id ที่ได้รับมา
};

/* ======================= PIN ======================= */

export const togglePin = async (postId: string, userId: string, isPinned: boolean) => {
  const post = await postRepository.findById(postId); // ตรวจสอบว่าโพสต์ที่ต้องการปักหมุดมีอยู่จริงหรือไม่
  if (!post) throw new AppError(404, 'Post not found');

  await assertWorkspaceMember(post.workspaceId, userId);

  const allowed = await hasPermission(post.workspaceId, userId, PERMISSIONS.PIN_POST);
  if (!allowed) {
    throw new AppError(403, 'Insufficient permissions');
  }

  return postRepository.updatePin(postId, isPinned); // เรียกใช้ฟังก์ชัน updatePin ใน postRepository เพื่อทำการปักหมุดหรือยกเลิกปักหมุดโพสต์ตาม id ที่ได้รับมา และสถานะ isPinned ที่ต้องการตั้งค่า
};

/* ======================= COMMENTS ======================= */

export const getComments = async (
  postId: string,
  userId: string,
  options: { limit?: number; offset?: number },
) => {
  const post = await postRepository.findById(postId); // ตรวจสอบว่าโพสต์ที่ต้องการดึงคอมเมนต์มีอยู่จริงหรือไม่
  if (!post) throw new AppError(404, 'Post not found');

  await assertWorkspaceMember(post.workspaceId, userId);

  const limit = Math.min(options.limit ?? 50, 100); // จำกัดจำนวนคอมเมนต์ที่ดึงมาได้สูงสุดไม่เกิน 100 คอมเมนต์ต่อครั้ง
  const offset = options.offset ?? 0; // กำหนดค่าเริ่มต้นของ offset เป็น 0 ถ้าไม่ได้รับค่ามา เพื่อใช้ในการแบ่งหน้า (pagination) ของผลลัพธ์คอมเมนต์

  const { comments, total } = await postRepository.findComments(postId, { limit, offset }); // ดึงรายการคอมเมนต์ของโพสต์ 
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

  const comment = await postRepository.createComment(postId, userId, content); // สร้างคอมเมนต์ใหม่ในโพสต์ตาม postId, userId และ content ที่ได้รับมา

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

  return comment; // คืนค่าคอมเมนต์ที่ถูกสร้างขึ้นใหม่
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await postRepository.findCommentById(commentId); // ตรวจสอบว่าคอมเมนต์ที่ต้องการลบมีอยู่จริงหรือไม่
  if (!comment) throw new AppError(404, 'Comment not found');

  const member = await postRepository.findWorkspaceMember(comment.post.workspaceId, userId);

  if (
    comment.userId !== userId &&
    (!member ||
      !(await hasPermission(comment.post.workspaceId, userId, PERMISSIONS.DELETE_ANY_COMMENT))) //  ตรวจสอบว่า user เป็นผู้เขียนคอมเมนต์หรือไม่ ถ้าไม่ใช่ให้ตรวจสอบว่ามีสิทธิ์ในการลบคอมเมนต์ของคนอื่นหรือไม่ ถ้าไม่มีทั้งสองอย่างนี้จะไม่สามารถลบคอมเมนต์ได้
  ) {
    throw new AppError(403, 'Insufficient permissions');
  }

  await postRepository.removeComment(commentId); // เรียกใช้ฟังก์ชัน removeComment
};
