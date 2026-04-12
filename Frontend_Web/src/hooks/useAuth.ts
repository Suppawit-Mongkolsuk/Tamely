// ===== useAuth Hook =====
// จัดการ auth state ทั่วทั้งแอป (Cookie-based)

import { useState, useCallback } from 'react';
import { authService } from '@/services';
import { setSocketToken } from '@/lib/socket';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
} from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      setUser(response.user);
      // เก็บ token เพื่อใช้กับ socket
      setSocketToken(response.token);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      setUser(response.user);
      // เก็บ token เพื่อใช้กับ socket
      setSocketToken(response.token);
      return response;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (data: ForgotPasswordRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      return await authService.forgotPassword(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setSocketToken('');
  }, []);

  // เรียก /auth/me เพื่อเช็คว่า cookie ยังใช้ได้ไหม
  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await authService.checkAuth();
      if (currentUser) {
        setUser(currentUser);
        // ดึง token สำหรับ socket (page refresh)
        const token = await authService.getSocketToken();
        if (token) setSocketToken(token);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    setUser,
    isLoading,
    error,
    login,
    register,
    forgotPassword,
    logout,
    restoreSession,
  };
}
