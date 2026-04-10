import multer, { FileFilterCallback } from 'multer';
import { memoryStorage } from 'multer';
import { Request } from 'express';

// ===== Upload Middleware Factory =====
// ใช้ multer memoryStorage — ไฟล์เก็บใน Buffer ก่อนส่งต่อให้ Supabase Storage
//
// Usage:
//   createUploadMiddleware(10)               — รับทุก MIME type, จำกัด 10 MB
//   createUploadMiddleware(5, ['image/*'])   — รับเฉพาะรูปภาพ, จำกัด 5 MB
//
// เพิ่ม feature ใหม่:
//   export const taskFileUpload = createUploadMiddleware(20);

type FileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => void;

/**
 * สร้าง multer middleware พร้อมกำหนด maxSizeMB และ allowedMimeTypes
 *
 * @param maxSizeMB        - ขนาดไฟล์สูงสุด (MB)
 * @param allowedMimeTypes - MIME types ที่อนุญาต (ถ้าไม่ระบุ = รับทุก type)
 *                           รองรับ wildcard เช่น 'image/*'
 */
export function createUploadMiddleware(maxSizeMB: number, allowedMimeTypes?: string[]) {
  const fileFilter: FileFilter | undefined = allowedMimeTypes
    ? (_req, file, cb) => {
        const allowed = allowedMimeTypes.some((pattern) => {
          if (pattern.endsWith('/*')) {
            const prefix = pattern.slice(0, -2);
            return file.mimetype.startsWith(prefix + '/');
          }
          return file.mimetype === pattern;
        });

        if (allowed) {
          cb(null, true);
        } else {
          cb(new Error(`ประเภทไฟล์ไม่รองรับ: ${file.mimetype}`));
        }
      }
    : undefined;

  return multer({
    storage: memoryStorage(),
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    ...(fileFilter ? { fileFilter } : {}),
  });
}

// ===== Pre-configured Instances =====

/** Avatar upload — รับเฉพาะรูป, สูงสุด 2 MB */
export const avatarUpload = createUploadMiddleware(2, ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

/** Post image upload — รับเฉพาะรูป, สูงสุด 5 MB */
export const postImageUpload = createUploadMiddleware(5, ['image/*']);

/** Chat file upload — รับทุก type, สูงสุด 10 MB */
export const chatFileUpload = createUploadMiddleware(10);
