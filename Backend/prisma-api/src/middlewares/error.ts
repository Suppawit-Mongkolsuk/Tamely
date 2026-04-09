import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error('Error:', err);

  // AppError — HTTP errors ที่ throw จาก service layer
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }

  // JSON body พัง
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
    if (err.code === 'P2002') {
      return res
        .status(409)
        .json({ success: false, error: 'Duplicate value (unique constraint)' });
    }
    if (err.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, error: 'Record not found' });
    }
    if (err.code === 'P2003') {
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
