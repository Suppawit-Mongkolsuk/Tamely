import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string; // เพิ่ม userId ลงใน Request object (JWT token uses string)
  workspaceId?: string;
  adminUsername?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[]; // ข้อมูลที่ส่งกลับมาเป็น array ของ T
  total: number; // จำนวนทั้งหมดของข้อมูล
  page: number; // หน้าในปัจจุบัน
  pageSize: number; // จำนวนข้อมูลต่อหน้า
}

// Custom error class สำหรับจัดการ error ใน API
export class AppError extends Error {
  code?: string;
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}
