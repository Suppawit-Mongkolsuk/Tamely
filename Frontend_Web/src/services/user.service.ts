// ===== User Service =====
// จัดการอัปเดตโปรไฟล์ & อัปโหลด Avatar

import { apiClient } from './api';
import type { User, ApiSuccessResponse } from '@/types';

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
}

export const userService = {
  /**
   * อัปเดตข้อมูลโปรไฟล์ (displayName, bio)
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.patch<ApiSuccessResponse<User>>(
      '/auth/profile',
      data,
    );
    return response.data;
  },

  /**
   * อัปโหลด avatar (ส่งเป็น multipart/form-data)
   * @param file - ไฟล์รูปจาก <input type="file">
   * @returns User object ที่มี avatarUrl ใหม่
   */
  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.upload<ApiSuccessResponse<User>>(
      '/auth/avatar',
      formData,
    );
    return response.data;
  },
};
