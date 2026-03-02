// ===== Auth Service =====
// จัดการ Login, Register, Logout, Token

import { apiClient } from './api';
import type { AuthResponse, LoginRequest, RegisterRequest, ForgotPasswordRequest } from '@/types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    apiClient.setToken(response.accessToken);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    apiClient.setToken(response.accessToken);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    return apiClient.post('/auth/forgot-password', data);
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.setToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  // เรียกตอนเปิดแอปเพื่อ restore session
  restoreSession(): boolean {
    const token = localStorage.getItem('accessToken');
    if (token) {
      apiClient.setToken(token);
      return true;
    }
    return false;
  },
};
