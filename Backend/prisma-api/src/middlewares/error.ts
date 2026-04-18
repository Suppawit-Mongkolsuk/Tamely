import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';


// เช็ค error เเล้วเเปลงเป็น http response ที่เหมาะสม
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error('Error:', err);

  // AppError — HTTP errors ที่ใช้ในส่วน service 
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({  // ส่ง status code ตามที่กำหนดใน AppError
      success: false,
      error: err.message,
      ...((err as any).code && { code: (err as any).code }), // ถ้ามี code ก็เพิ่มเข้าไปใน response
    });
  }

  // JSON body พังส่งมาไม่ถูกต้อง
  if (
    err instanceof SyntaxError &&
    (err as any).status === 400 &&
    'body' in err
  ) {
    return res.status(400).json({ success: false, error: 'Invalid JSON body' });
  }

  // Validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: err.message }); 
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  // JWT
  if (err instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ success: false, error: 'Token expired' });
  }
  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  // Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {   // unique ซ้ำ
      return res
        .status(409)
        .json({ success: false, error: 'Duplicate value (unique constraint)' });
    }
    if (err.code === 'P2025') {   // record ไม่พบ
      return res
        .status(404)
        .json({ success: false, error: 'Record not found' });
    }
    if (err.code === 'P2003') {   // foreign key ล้มเหลว
      return res
        .status(409)
        .json({ success: false, error: 'Foreign key constraint failed' });
    }
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res
      .status(503)
      .json({ success: false, error: 'Database connection failed' });
  }

  // Fallback
  res.status(500).json({ success: false, error: 'Internal Server Error' });
}
