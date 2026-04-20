// ===== Router =====
// กำหนด routes ทั้งหมดด้วย createBrowserRouter

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuthContext } from '@/contexts/AuthContext';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { AppLayout } from '@/components/layout';
import { RequireAuth, RequireWorkspace, RequireManagementAccess, RedirectIfAuthenticated } from '../components/common/ProtectedRoute';

// ── Lazy page imports ────────────────────────────────────────────────────────
const LoginRegisterPage = lazy(() =>
  import('@/Pages/LoginRegisterPage').then((m) => ({ default: m.LoginRegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('@/Pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/Pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const LandingPage = lazy(() =>
  import('@/Pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const AdminDashboardPage = lazy(() =>
  import('@/Pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
);
const HomePage = lazy(() =>
  import('@/Pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const ChatRoomsPage = lazy(() =>
  import('@/Pages/ChatRoomsPage').then((m) => ({ default: m.ChatRoomsPage })),
);
const AIChatPage = lazy(() =>
  import('@/Pages/AIChatPage').then((m) => ({ default: m.AIChatPage })),
);
const CalendarPage = lazy(() =>
  import('@/Pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
);
const ManagementPage = lazy(() =>
  import('@/Pages/ManagementPage').then((m) => ({ default: m.ManagementPage })),
);
const SettingsPage = lazy(() =>
  import('@/Pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
function NotFoundPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#1f2937' }}>404</h1>
      <p style={{ color: '#6b7280' }}>ไม่พบหน้าที่ต้องการ</p>
      <a href="/" style={{ color: '#3b82f6', textDecoration: 'underline' }}>กลับหน้าหลัก</a>
    </div>
  );
}

// ── Loading fallback ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-muted">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
}

// ── Page wrappers (รองรับ props + navigation) ────────────────────────────────
function LoginPage() {
  const navigate = useNavigate(); // ใช้สำหรับเปลี่ยนหน้าเมื่อ login สำเร็จหรือกดลิงก์ forgot password
  const { logout } = useAuthContext() ;
  const { clearCurrentWorkspace } = useWorkspaceContext(); // ใช้สำหรับเคลียร์ workspace ปัจจุบันเมื่อ logout (กรณีที่ user เคย login มาแล้วแต่ยังไม่ได้เลือก workspace แล้วกลับมาที่หน้า login อีกครั้ง เพื่อป้องกันข้อมูล workspace เดิมหลงเหลืออยู่)

  const handleLoginComplete = (sessionType: 'user' | 'admin') => { // ฟังก์ชันนี้จะถูกเรียกเมื่อ login หรือ register สำเร็จ โดย sessionType จะบอกว่าเป็น session ของ user ธรรมดาหรือ admin เพื่อให้ navigate ไปยังหน้า dashboard ที่ถูกต้อง
    if (sessionType === 'admin') {
      navigate('/admin'); // ถ้าเป็น admin ให้ไปที่หน้า admin dashboard เลย
      return;
    }
    clearCurrentWorkspace(); // เคลียร์ workspace ปัจจุบันก่อน เพราะหลังจาก login สำเร็จแล้ว user จะถูกนำไปที่หน้าเลือก workspace ซึ่งยังไม่มี workspace ไหนถูกเลือกอยู่ ถ้าไม่เคลียร์ไว้ก่อนอาจจะทำให้ข้อมูล workspace เดิมหลงเหลืออยู่ได้
    navigate('/workspace'); // ถ้าเป็น user ธรรมดาให้ไปที่หน้าเลือก workspace ก่อน เพราะยังไม่มี workspace ไหนถูกเลือกอยู่
  };

  return (
    <RedirectIfAuthenticated>
      <Suspense fallback={<PageLoader />}> // ใช้ Suspense เพื่อแสดง loading spinner ระหว่างที่กำลังโหลดหน้า login/register อยู่
        <LoginRegisterPage
          onComplete={handleLoginComplete} // ส่งฟังก์ชัน handleLoginComplete ไปให้หน้า LoginRegisterPage เพื่อให้เรียกใช้เมื่อ login หรือ register สำเร็จ
          onForgotPassword={() => navigate('/forgot-password')} // ส่งฟังก์ชัน onForgotPassword ไปให้หน้า LoginRegisterPage เพื่อให้เรียกใช้เมื่อกดลิงก์ forgot password เพื่อ navigate ไปที่หน้า forgot password
        />
      </Suspense>
    </RedirectIfAuthenticated>
  );
}

function ForgotPage() {
  const navigate = useNavigate();
  return (
    <Suspense fallback={<PageLoader />}>
      <ForgotPasswordPage
        onBack={() => navigate('/login')}
        onResetToken={(token) => navigate(`/reset-password?token=${token}`)}
      />
    </Suspense>
  );
}

function ResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, logout } = useAuthContext();
  const { clearCurrentWorkspace } = useWorkspaceContext();

  const handlePasswordResetSuccess = async () => {
    if (isAuthenticated) {
      await logout();
      clearCurrentWorkspace();
    }
    navigate('/login', { replace: true });
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <ResetPasswordPage
        token={searchParams.get('token') ?? ''}
        onBack={() => navigate('/login')}
        onSuccess={handlePasswordResetSuccess}
      />
    </Suspense>
  );
}

function WorkspacePage() {
  const navigate = useNavigate();
  const { logout } = useAuthContext();
  const { clearCurrentWorkspace } = useWorkspaceContext();

  const handleLogout = async () => { // ฟังก์ชันนี้จะถูกเรียกเมื่อกดปุ่ม logout ในหน้าเลือก workspace เพื่อให้ logout ก่อนแล้วค่อย navigate ไปที่หน้า login
    await logout();
    clearCurrentWorkspace();
    navigate('/login');
  };

  return (
    <RequireAuth>
      <Suspense fallback={<PageLoader />}> // ใช้ Suspense เพื่อแสดง loading spinner ระหว่างที่กำลังโหลดหน้าเลือก workspace อยู่
        <LandingPage
          onComplete={() => navigate('/home')}
          onLogout={handleLogout}
        />
      </Suspense>
    </RequireAuth>
  );
}

function AdminDashboardWrapper() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminDashboardPage />
    </Suspense>
  );
}

function AppLayoutWrapper() {
  const navigate = useNavigate();
  const { logout } = useAuthContext();
  const { clearCurrentWorkspace } = useWorkspaceContext();

  const handleLogout = async () => {
    await logout();
    clearCurrentWorkspace();
    navigate('/login');
  };

  return (
    <RequireWorkspace>
      <AppLayout onLogout={handleLogout} />
    </RequireWorkspace>
  );
}

function SettingsWrapper() {
  const navigate = useNavigate();
  const { logout } = useAuthContext();
  const { clearCurrentWorkspace } = useWorkspaceContext();

  const handleLogout = async () => {
    await logout();
    clearCurrentWorkspace();
    navigate('/login');
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <SettingsPage onLogout={handleLogout} />
    </Suspense>
  );
}

function ManagementWrapper() {
  return (
    <RequireManagementAccess>
      <Suspense fallback={<PageLoader />}>
        <ManagementPage />
      </Suspense>
    </RequireManagementAccess>
  );
}

// ── Router ───────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // Public — เข้าได้เสมอ
  { path: '/login', element: <LoginPage /> },
  { path: '/admin', element: <AdminDashboardWrapper /> },
  { path: '/forgot-password', element: <ForgotPage /> },
  { path: '/reset-password', element: <ResetPage /> },

  // Workspace selection — login แล้ว แต่ยังไม่เลือก workspace
  { path: '/workspace', element: <WorkspacePage /> },

  // Protected — login + มี workspace แล้ว
  {
    element: <AppLayoutWrapper />,
    children: [
      { path: '/home', element: <Suspense fallback={<PageLoader />}><HomePage /></Suspense> },
      { path: '/chat-rooms', element: <Suspense fallback={<PageLoader />}><ChatRoomsPage /></Suspense> },
      { path: '/ai-chat', element: <Suspense fallback={<PageLoader />}><AIChatPage /></Suspense> },
      { path: '/calendar', element: <Suspense fallback={<PageLoader />}><CalendarPage /></Suspense> },
      { path: '/management', element: <Navigate to="/management/members" replace /> },
      { path: '/management/members', element: <ManagementWrapper /> },
      { path: '/management/rooms', element: <ManagementWrapper /> },
      { path: '/management/workspace', element: <ManagementWrapper /> },
      { path: '/settings', element: <SettingsWrapper /> },
    ],
  },

  // Fallbacks
  { path: '/not-found', element: <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
