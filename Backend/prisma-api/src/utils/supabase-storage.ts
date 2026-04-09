// ===== Supabase Storage Client =====
// ใช้ fetch REST API + apikey header — รองรับ sb_secret_xxx format

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '⚠️  SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ยังไม่ได้ตั้งค่า — อัปโหลดไฟล์จะไม่ทำงาน',
  );
}

export const AVATAR_BUCKET = 'avatars';
export const POST_IMAGES_BUCKET = 'post-images';

/** สร้าง auth headers ที่รองรับทั้ง Legacy JWT (eyJ...) และ New format (sb_secret_...) */
function authHeaders(): Record<string, string> {
  if (!supabaseServiceKey) return {};
  // Legacy JWT format ใช้ Bearer token ปกติ
  if (supabaseServiceKey.startsWith('eyJ')) {
    return { Authorization: `Bearer ${supabaseServiceKey}` };
  }
  // New sb_secret_ format ใช้ apikey header
  return { apikey: supabaseServiceKey };
}

/**
 * อัปโหลดไฟล์ avatar ไปยัง Supabase Storage ผ่าน REST API
 */
export async function uploadAvatar(
  userId: string,
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<string> {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase ยังไม่ได้ตั้งค่า');
  }

  const ext = originalName.split('.').pop() || 'jpg';
  const filePath = `${userId}/avatar-${Date.now()}.${ext}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${AVATAR_BUCKET}/${filePath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Supabase upload error:', response.status, errText);
    throw new Error('ไม่สามารถอัปโหลดรูปภาพได้');
  }

  return `${supabaseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/${filePath}`;
}

/**
 * ลบ avatar เก่าออกจาก Storage (ถ้ามี)
 */
export async function deleteOldAvatar(avatarUrl: string | null): Promise<void> {
  if (!avatarUrl || !supabaseUrl || !supabaseServiceKey) return;

  try {
    const match = avatarUrl.match(
      new RegExp(`/storage/v1/object/public/${AVATAR_BUCKET}/(.+)$`),
    );
    if (!match) return;

    const filePath = match[1];
    await fetch(`${supabaseUrl}/storage/v1/object/${AVATAR_BUCKET}/${filePath}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
  } catch (err) {
    console.warn('Failed to delete old avatar:', err);
  }
}

/**
 * อัปโหลดรูปภาพโพสต์ไปยัง Supabase Storage
 */
export async function uploadPostImage(
  postId: string,
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<string> {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase ยังไม่ได้ตั้งค่า');
  }

  const ext = originalName.split('.').pop() || 'jpg';
  const filePath = `${postId}/${Date.now()}.${ext}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${POST_IMAGES_BUCKET}/${filePath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Supabase upload error:', response.status, errText);
    throw new Error('ไม่สามารถอัปโหลดรูปภาพโพสต์ได้');
  }

  return `${supabaseUrl}/storage/v1/object/public/${POST_IMAGES_BUCKET}/${filePath}`;
}
