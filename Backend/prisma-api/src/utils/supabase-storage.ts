// ===== Supabase Storage Client =====
// ใช้ fetch REST API + apikey header — รองรับ sb_secret_xxx format
//
// Architecture:
//   uploadToStorage()  ← generic core (ทุก upload ใช้ตรงนี้)
//   uploadAvatar()     ← wrapper สำหรับ Avatar
//   uploadPostImage()  ← wrapper สำหรับ Post Image
//   uploadChatFile()   ← wrapper สำหรับ Chat File/Image
//   ensureBucket()     ← สร้าง bucket ถ้ายังไม่มี (เรียกตอน startup)
//   deleteFromStorage() ← ลบไฟล์จาก bucket

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '⚠️  SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ยังไม่ได้ตั้งค่า — อัปโหลดไฟล์จะไม่ทำงาน',
  );
}

// ===== Bucket Names =====
export const AVATAR_BUCKET = 'avatars';
export const POST_IMAGES_BUCKET = 'post-images';
export const CHAT_FILES_BUCKET = 'chat-files';
export const WORKSPACE_ICONS_BUCKET = 'workspace-icons';

// ===== Auth Headers =====
// รองรับทั้ง JWT (eyJ...) และ new-style key (sb_secret_/anon)
function authHeaders(): Record<string, string> {
  if (!supabaseServiceKey) return {};
  if (supabaseServiceKey.startsWith('eyJ')) {
    return { Authorization: `Bearer ${supabaseServiceKey}` };
  }
  return { apikey: supabaseServiceKey };
}

// ===== Generic Core =====

/**
 * อัปโหลดไฟล์ไปยัง Supabase Storage — ฟังก์ชันหลักที่ทุก feature ใช้ร่วมกัน
 *
 * @param bucket  - ชื่อ bucket เช่น 'avatars', 'post-images', 'chat-files'
 * @param filePath - path ภายใน bucket เช่น 'userId/avatar-123.jpg'
 * @param fileBuffer - ข้อมูลไฟล์ (Buffer)
 * @param mimeType - MIME type เช่น 'image/jpeg'
 * @returns public URL ของไฟล์ที่อัปโหลด
 *
 * @example เพิ่ม feature ใหม่ในอนาคต:
 *   export async function uploadTaskAttachment(taskId, buffer, mime, name) {
 *     const filePath = `${taskId}/${Date.now()}_${sanitizeName(name)}`;
 *     return uploadToStorage('task-files', filePath, buffer, mime);
 *   }
 */
export async function uploadToStorage(
  bucket: string,
  filePath: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (!supabaseUrl || !supabaseServiceKey) { // ถ้า Supabase ไม่พร้อม ให้โยน error ออกมา
    throw new Error('Supabase ยังไม่ได้ตั้งค่า');
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`; // URL สำหรับอัปโหลดไฟล์ไปยัง bucket และ path ที่กำหนด

  const response = await fetch(uploadUrl, { // เรียก API เพื่ออัปโหลดไฟล์
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });

  if (!response.ok) { // ถ้าอัปโหลดไม่สำเร็จ ให้ log error และโยน error ออกมา
    const errText = await response.text(); // ดึงข้อความ error จาก response เพื่อช่วย debug
    console.error(`Supabase upload error [${bucket}/${filePath}]:`, response.status, errText);
    throw new Error(`ไม่สามารถอัปโหลดไฟล์ไปยัง ${bucket} ได้`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`; // คืน public URL ของไฟล์ที่อัปโหลด เพื่อให้ client สามารถเข้าถึงได้
}

/**
 * ลบไฟล์ออกจาก Supabase Storage — ใช้ได้กับทุก bucket
 *
 * @param bucket   - ชื่อ bucket
 * @param publicUrl - public URL ของไฟล์ที่ต้องการลบ
 */
export async function deleteFromStorage(bucket: string, publicUrl: string | null): Promise<void> {
  if (!publicUrl || !supabaseUrl || !supabaseServiceKey) return; // ถ้าไม่มี URL หรือ Supabase ไม่พร้อม ให้ข้ามการลบ

  try {
    const match = publicUrl.match( // ดึง filePath จาก public URL โดยใช้ regex
      new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`),
    );
    if (!match) return; 

    const filePath = match[1];
    await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`, { // เรียก API ลบไฟล์
      method: 'DELETE',
      headers: authHeaders(),
    });
  } catch (err) {
    console.warn(`⚠️ Failed to delete from ${bucket}:`, err); // ไม่ throw error ถ้าเกิดปัญหาในการลบ — แค่ log ไว้
  }
}

/**
 * สร้าง Supabase Storage bucket ถ้ายังไม่มี — เรียกครั้งเดียวตอน startup
 */
export async function ensureBucket(bucketName: string, isPublic = true): Promise<void> {
  if (!supabaseUrl || !supabaseServiceKey) return;
  try {
    await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bucketName, name: bucketName, public: isPublic }),
    });
    // ไม่ throw error ถ้า bucket มีอยู่แล้ว (409 Conflict) — ถือว่า OK
  } catch (err) {
    console.warn(`⚠️ Could not ensure bucket "${bucketName}":`, err);
  }
}

// ===== Helpers =====

/** Sanitize ชื่อไฟล์ให้ปลอดภัยสำหรับ URL */
function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// ===== Feature Wrappers =====
// ทุก feature เรียกใช้ uploadToStorage() ร่วมกัน
// ต่างกันแค่ bucket และ path pattern

/**
 * [Feature: Profile] อัปโหลด Avatar ผู้ใช้
 * Path: avatars/{userId}/avatar-{timestamp}.{ext}
 */
export async function uploadAvatar( // อัปโหลดรูปโปรไฟล์ของ user ไปยัง bucket 'avatars'
  userId: string,
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<string> {
  const ext = originalName.split('.').pop() || 'jpg'; // ดึงนามสกุลไฟล์จากชื่อเดิม (default เป็น jpg ถ้าไม่มี)
  const filePath = `${userId}/avatar-${Date.now()}.${ext}`; // สร้าง path สำหรับไฟล์ '
  return uploadToStorage(AVATAR_BUCKET, filePath, fileBuffer, mimeType); // เรียกฟังก์ชันหลักเพื่ออัปโหลดไฟล์ไปยัง bucket 'avatars' เเละ คืน public URL กลับมา
}

/** [Feature: Profile] ลบ Avatar เก่า */
export async function deleteOldAvatar(avatarUrl: string | null): Promise<void> {
  return deleteFromStorage(AVATAR_BUCKET, avatarUrl);
}

/**
 * [Feature: Feed] อัปโหลดรูปภาพโพสต์ (สูงสุด 10 รูปต่อโพสต์)
 * Path: post-images/{postId}/{timestamp}.{ext}
 */
export async function uploadPostImage(
  postId: string,
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<string> {
  const ext = originalName.split('.').pop() || 'jpg';
  const filePath = `${postId}/${Date.now()}.${ext}`; // สร้าง path สำหรับไฟล์รูปภาพของโพสต์ โดยใช้ postId เป็นโฟลเดอร์หลัก และ timestamp เป็นส่วนหนึ่งของชื่อไฟล์ เพื่อป้องกันการชนกันของชื่อไฟล์
  return uploadToStorage(POST_IMAGES_BUCKET, filePath, fileBuffer, mimeType); // เรียกฟังก์ชันหลักเพื่ออัปโหลดไฟล์ไปยัง bucket 'post-images' และคืน public URL กลับมา
}

/**
 * [Feature: Workspace] อัปโหลดไอคอน Workspace
 * Path: workspace-icons/{workspaceId}/icon-{timestamp}.{ext}
 */
export async function uploadWorkspaceIcon( // อัปโหลดไอคอนของ workspace ไปยัง bucket 'workspace-icons'
  workspaceId: string,
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<string> {
  const ext = originalName.split('.').pop() || 'png'; // ไอคอน workspace แนะนำให้ใช้ PNG เป็นหลัก (default เป็น png ถ้าไม่มีนามสกุล)
  const filePath = `${workspaceId}/icon-${Date.now()}.${ext}`; // สร้าง path สำหรับไฟล์ไอคอนของ workspace
  return uploadToStorage(WORKSPACE_ICONS_BUCKET, filePath, fileBuffer, mimeType); // คืน public URL 
}

/** [Feature: Workspace] ลบไอคอน Workspace เก่า */
export async function deleteOldWorkspaceIcon(iconUrl: string | null): Promise<void> {
  return deleteFromStorage(WORKSPACE_ICONS_BUCKET, iconUrl);
}

/**
 * [Feature: DM Chat] อัปโหลดไฟล์/รูปภาพในแชท DM
 * Path: chat-files/{conversationId}/{timestamp}_{filename}.{ext}
 * รองรับทั้ง Web และ Mobile (รับ Buffer เหมือนกัน)
 */
export async function uploadChatFile(
  conversationId: string,
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<string> {
  const filePath = `${conversationId}/${Date.now()}_${sanitizeName(originalName)}`;
  return uploadToStorage(CHAT_FILES_BUCKET, filePath, fileBuffer, mimeType);
}

