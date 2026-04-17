// ===== User Types =====

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  status?: string;
  lastSeenAt?: string | null;
}

export type UserRole = 'owner' | 'admin' | 'member' | 'guest';

export type UserStatus = 'active' | 'inactive' | 'banned';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

// Backend ส่งกลับมาในรูปแบบนี้
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export interface AuthResponseData {
  token: string;
  user: User;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
