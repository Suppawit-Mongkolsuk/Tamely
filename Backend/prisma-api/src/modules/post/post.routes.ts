import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validateRequest, asyncHandler } from '../../middlewares/validate';
import { AuthRequest } from '../../types';
import { CreatePostSchema, TogglePinSchema, AddCommentSchema } from './post.model';
import * as postService from './post.service';
import { uploadPostImage } from '../../utils/supabase-storage';
import { postImageUpload } from '../../middlewares/upload.middleware';

const router = Router();
router.use(authenticate);

const param = (value: string | string[] | undefined): string => // ช่วยอ่านค่า param ที่อาจจะเป็น string หรือ array (กรณีที่มีหลายค่า) และคืนค่าเป็น string เดียว (ถ้าเป็น array ให้เอาค่าตัวแรก)
  Array.isArray(value) ? value[0] : (value ?? '');

// POST /api/workspaces/:wsId/posts — สร้างโพสต์ใหม่ใน workspace
router.post('/workspaces/:wsId/posts', validateRequest(CreatePostSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await postService.createPost(param(req.params.wsId), req.userId!, { workspaceId: param(req.params.wsId), ...req.body });
  res.status(201).json({ success: true, data: post });
}));

// GET /api/workspaces/:wsId/posts // ดึงรายการโพสต์ใน workspace พร้อมข้อมูลจำนวนคอมเมนต์ (ถ้ามี)
router.get('/workspaces/:wsId/posts', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await postService.getPosts(param(req.params.wsId), req.userId!, {
    limit: req.query.limit ? Number(req.query.limit) : undefined, 
    offset: req.query.offset ? Number(req.query.offset) : undefined,
  });
  res.json({ success: true, ...result });
}));

// PATCH /api/posts/:id // แก้ไขโพสต์ (เฉพาะ title, body, imageUrls)
router.patch('/posts/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await postService.updatePost(param(req.params.id), req.userId!, req.body);
  res.json({ success: true, data: post }); 
}));

// DELETE /api/posts/:id // ลบโพสต์ (ถ้า user เป็นผู้เขียนโพสต์หรือมีสิทธิ์ในการลบโพสต์ของคนอื่น)
router.delete('/posts/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await postService.deletePost(param(req.params.id), req.userId!);
  res.json({ success: true, message: 'Post deleted' });
}));

// PATCH /api/posts/:id/pin // ปักหมุดหรือยกเลิกปักหมุดโพสต์ 
router.patch('/posts/:id/pin', validateRequest(TogglePinSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await postService.togglePin(param(req.params.id), req.userId!, req.body.isPinned);
  res.json({ success: true, data: post });
}));

// GET /api/posts/:id/comments // ดึงรายการคอมเมนต์ของโพสต์ พร้อมข้อมูลผู้เขียนคอมเมนต์ (ถ้ามี) 
router.get('/posts/:id/comments', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await postService.getComments(param(req.params.id), req.userId!, {
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    offset: req.query.offset ? Number(req.query.offset) : undefined,
  });
  res.json({ success: true, ...result });
}));

// POST /api/posts/:id/comments // เพิ่มคอมเมนต์ใหม่ในโพสต์
router.post('/posts/:id/comments', validateRequest(AddCommentSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const comment = await postService.addComment(param(req.params.id), req.userId!, req.body.content);
  res.status(201).json({ success: true, data: comment });
}));

// DELETE /api/comments/:id // ลบคอมเมนต์ 
router.delete('/comments/:id', asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await postService.deleteComment(param(req.params.id), req.userId!);
  res.json({ success: true, message: 'Comment deleted' });
}));

// POST /api/posts/upload-images — อัปโหลดรูปภาพสำหรับโพสต์ (สูงสุด 10 รูป)
router.post( 
  '/posts/upload-images',
  postImageUpload.array('images', 10),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[]; // รับไฟล์รูปภาพที่ถูกอัปโหลดมาจาก middleware postImageUpload
    if (!files || files.length === 0) { // ตรวจสอบว่ามีไฟล์รูปภาพถูกอัปโหลดมาหรือไม่ ถ้าไม่มีให้ส่ง error 400
      res.status(400).json({ success: false, message: 'ไม่พบไฟล์รูปภาพ' });
      return;
    }

    const postId = req.body.postId || `temp-${req.userId}-${Date.now()}`; 
    const uploadedUrls = await Promise.all(
      files.map((file) => // อัปโหลดรูปภาพแต่ละไฟล์ไปยัง Supabase Storage โดยใช้ฟังก์ชัน uploadPostImage
        uploadPostImage(postId, file.buffer, file.mimetype, file.originalname),
      ),
    );

    res.status(201).json({ success: true, data: { urls: uploadedUrls } });
  }),
);

export default router;
