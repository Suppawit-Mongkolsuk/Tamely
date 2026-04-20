// ===== Auth Context =====
// แชร์ auth state ทั่วทั้ง component tree (Cookie-based)

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/hooks';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  LoginResponseData,
} from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSessionReady: boolean; // true เมื่อ restoreSession เสร็จแล้ว
  error: string | null;
  login: (data: LoginRequest) => Promise<LoginResponseData>;
  register: (data: RegisterRequest) => Promise<unknown>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<unknown>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [isSessionReady, setIsSessionReady] = useState(false);

  // Restore session เมื่อเปิดแอป (async – เรียก GET /auth/me)
  useEffect(() => {
    auth.restoreSession().finally(() => {
      setIsSessionReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    user: auth.user,
    isLoading: auth.isLoading,
    isAuthenticated: auth.user !== null,
    isSessionReady,
    error: auth.error,
    login: auth.login,
    register: auth.register,
    forgotPassword: auth.forgotPassword,
    logout: auth.logout,
    setUser: auth.setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext); // ใช้ context นี้ใน component ใดก็ได้ที่อยู่ภายใต้ AuthProvider เพื่อเข้าถึง auth state และฟังก์ชันต่างๆ เช่น login, logout, register เป็นต้น
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
