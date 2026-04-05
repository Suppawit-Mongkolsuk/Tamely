import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuthContext } from '@/contexts';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';

const LoginRegisterPage = lazy(() =>
  import('./Pages/LoginRegisterPage').then((m) => ({
    default: m.LoginRegisterPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import('./Pages/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import('./Pages/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const LandingPage = lazy(() =>
  import('./Pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const HomePage = lazy(() =>
  import('./Pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const ChatRoomsPage = lazy(() =>
  import('./Pages/ChatRoomsPage').then((m) => ({ default: m.ChatRoomsPage })),
);
const AIChatPage = lazy(() =>
  import('./Pages/AIChatPage').then((m) => ({ default: m.AIChatPage })),
);
const CalendarPage = lazy(() =>
  import('./Pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
);
const ManagementPage = lazy(() =>
  import('./Pages/ManagementPage').then((m) => ({ default: m.ManagementPage })),
);
const SettingsPage = lazy(() =>
  import('./Pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const NotFoundPage = lazy(() =>
  import('./Pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function App() {
  const { isAuthenticated, isSessionReady, logout } = useAuthContext();
  const { currentWorkspace, clearCurrentWorkspace } = useWorkspaceContext();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  if (!isSessionReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  const handleLoginComplete = () => {
    // Force workspace selection every new login session
    clearCurrentWorkspace();
    navigate('/workspace');
  };

  const handleJoinWorkspace = () => {
    navigate('/home');
  };

  const handleLogout = async () => {
    await logout();
    clearCurrentWorkspace();
    navigate('/login');
  };

  // หลังรีเซ็ตรหัสผ่านสำเร็จ — ล้าง session เก่าออกก่อนไปหน้า login
  const handlePasswordResetSuccess = async () => {
    if (isAuthenticated) {
      await logout();
      clearCurrentWorkspace();
    }
    navigate('/login', { replace: true });
  };

  const hasWorkspace = currentWorkspace !== null;

  return (
    <>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-muted">
            <LoadingSpinner size="lg" text="Loading..." />
          </div>
        }
      >
        <Routes>
          {/* ── Public routes: เข้าได้เสมอ ไม่ว่าจะล็อกอินหรือไม่ ── */}
          <Route
            path="/reset-password"
            element={
              <ResetPasswordPage
                token={searchParams.get('token') ?? ''}
                onBack={() => navigate('/login')}
                onSuccess={handlePasswordResetSuccess}
              />
            }
          />
          <Route
            path="/forgot-password"
            element={
              <ForgotPasswordPage
                onBack={() => navigate('/login')}
                onResetToken={(token) => navigate(`/reset-password?token=${token}`)}
              />
            }
          />

          {!isAuthenticated ? (
            <>
              <Route
                path="/login"
                element={
                  <LoginRegisterPage
                    onComplete={handleLoginComplete}
                    onForgotPassword={() => navigate('/forgot-password')}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : !hasWorkspace ? (
            <>
              <Route
                path="/workspace"
                element={<LandingPage onComplete={handleJoinWorkspace} onLogout={handleLogout} />}
              />
              <Route path="*" element={<Navigate to="/workspace" replace />} />
            </>
          ) : (
            <>
              <Route element={<AppLayout onLogout={handleLogout} />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/chat-rooms" element={<ChatRoomsPage />} />
                <Route path="/ai-chat" element={<AIChatPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/management" element={<ManagementPage />} />
                <Route
                  path="/settings"
                  element={<SettingsPage onLogout={handleLogout} />}
                />
              </Route>
              <Route path="/not-found" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </>
          )}
        </Routes>
      </Suspense>
      <Toaster richColors />
    </>
  );
}

export default App;
