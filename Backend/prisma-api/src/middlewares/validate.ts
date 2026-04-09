import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError, AuthRequest } from '../types';

/**
 * Middleware สำหรับ validate request body ด้วย Zod schema
 * ใช้งาน: router.post('/path', validateRequest(MySchema), handler)
 *
 * Schema ควรมีรูปแบบ z.object({ body: z.object({...}) })
 * เมื่อ validate ผ่าน req.body จะถูกแทนที่ด้วยค่าที่ผ่านการ parse แล้ว (trimmed, transformed)
 */
export const validateRequest =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({ body: req.body });

    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? 'Invalid input';
      res.status(400).json({ success: false, error: firstError });
      return;
    }

    // แทนที่ req.body ด้วยค่าที่ผ่าน parse (เช่น trim, lowercase จาก Zod transform)
    req.body = (result.data as { body: unknown }).body;
    next();
  };

/**
 * Wrapper สำหรับ async route handler
 * ดักจับ error ที่ throw จาก service แล้วส่งต่อไปยัง global errorHandler
 * ใช้งาน: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler =
  (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch((error: unknown) => {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else {
        next(error); // ส่งต่อให้ global errorHandler จัดการ
      }
    });
  };
