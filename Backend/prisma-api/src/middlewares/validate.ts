import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError, AuthRequest } from '../types';

/**
 * Middleware สำหรับ validate request body ด้วย Zod schema
 * ตรวจสอบข้อมลูที่ส่งมาว่าตรงตาม schema ไหม 
 */
export const validateRequest = // รับ Zod schema แล้ว return middleware function
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => { // รับ Zod schema แล้ว return middleware function
    const result = schema.safeParse({ //ตรวจข้อมูลแบบ ไม่ throw error
      body: req.body,
      params: req.params,
      query: req.query,
    });
    // ถ้า validation ไม่ผ่าน ให้ส่ง response 400 พร้อม error message ตัวแรกจาก Zod
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? 'Invalid input';
      res.status(400).json({ success: false, error: firstError });
      return;
    }

    // แทนที่ req.body ด้วยค่าที่ผ่าน trim, lowercase จาก Zod transform)
    req.body = (result.data as { body: unknown }).body;
    next();
  };

/**
  ใช้ครอบ async route เพื่อกัน error หลุด
 */
export const asyncHandler =
  (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>) => // รับ async function แล้ว return function ที่มีการ catch error
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch((error: unknown) => {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else {
        next(error); // ส่งต่อให้ global errorHandler จัดการ
      }
    });
  };
