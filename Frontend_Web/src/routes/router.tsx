// ===== Router =====
// กำหนด routes ทั้งหมดด้วย createBrowserRouter

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuthContext } from '@/contexts';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { AppLayout } from '@/components/layout';
import { RequireAuth, RequireWorkspace, RedirectIfAuthenticated } from '../components/common/ProtectedRoute';

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
const NotFoundPage = lazy(() =>
  import('@/Pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

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
  const navigate = useNavigate();
  const { logout } = useAuthContext();
  const { clearCurrentWorkspace } = useWorkspaceContext();

  const handleLoginComplete = () => {
    clearCurrentWorkspace();
    navigate('/workspace');
  };

  return (
    <RedirectIfAuthenticated>
      <Suspense fallback={<PageLoader />}>
        <LoginRegisterPage
          onComplete={handleLoginComplete}
          onForgotPassword={() => navigate('/forgot-password')}
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

  const handleLogout = async () => {
    await logout();
    clearCurrentWorkspace();
    navigate('/login');
  };

  return (
    <RequireAuth>
      <Suspense fallback={<PageLoader />}>
        <LandingPage
          onComplete={() => navigate('/home')}
          onLogout={handleLogout}
        />
      </Suspense>
    </RequireAuth>
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

// ── Router ───────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // Public — เข้าได้เสมอ
  { path: '/login', element: <LoginPage /> },
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
      { path: '/management', element: <Suspense fallback={<PageLoader />}><ManagementPage /></Suspense> },
      { path: '/settings', element: <SettingsWrapper /> },
    ],
  },

  // Fallbacks
  { path: '/not-found', element: <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
