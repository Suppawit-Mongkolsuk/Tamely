// ===== Auth Service =====
// จัดการ Login, Register, Logout (Cookie-based)

import { apiClient } from './api';
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  User,
  ApiSuccessResponse,
  AuthResponseData,
} from '@/types';

export const authService = {
  async login(data: LoginRequest): Promise<{ token: string; user: User }> {
    const response = await apiClient.post<ApiSuccessResponse<AuthResponseData>>(
      '/auth/login',
      data,
    );
    return response.data;
  },

  async register(
    data: RegisterRequest,
  ): Promise<{ token: string; user: User }> {
    const response = await apiClient.post<ApiSuccessResponse<AuthResponseData>>(
      '/auth/register',
      data,
    );
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiSuccessResponse<User>>('/auth/me');
    return response.data;
  },

  async forgotPassword(
    data: ForgotPasswordRequest,
  ): Promise<{ message: string }> {
    return apiClient.post('/auth/forgot-password', data);
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ถ้า logout ไม่สำเร็จก็ไม่เป็นไร
    }
  },

  // เช็คว่า login อยู่ไหมโดยเรียก /auth/me
  async checkAuth(): Promise<User | null> {
    try {
      return await this.getMe();
    } catch {
      return null;
    }
  },
};
