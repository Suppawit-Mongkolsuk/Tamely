import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuthContext } from '@/contexts';

// ===== Lazy-loaded Pages (code-splitting) =====
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
  const [hasJoinedWorkspace, setHasJoinedWorkspace] = useState(() => {
    return localStorage.getItem('hasJoinedWorkspace') === 'true';
  });

  const navigate = useNavigate();

  // รอจน restoreSession เสร็จ ก่อน render routes
  if (!isSessionReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  const handleLoginComplete = () => {
    navigate('/workspace');
  };

  const handleJoinWorkspace = () => {
    setHasJoinedWorkspace(true);
    localStorage.setItem('hasJoinedWorkspace', 'true');
    navigate('/home');
  };

  const handleLogout = async () => {
    await logout();
    setHasJoinedWorkspace(false);
    localStorage.removeItem('hasJoinedWorkspace');
    navigate('/login');
  };

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
          {/* ===== Public Routes ===== */}
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
              <Route
                path="/forgot-password"
                element={
                  <ForgotPasswordPage onBack={() => navigate('/login')} />
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : !hasJoinedWorkspace ? (
            /* ===== Workspace Selection ===== */
            <>
              <Route
                path="/workspace"
                element={<LandingPage onComplete={handleJoinWorkspace} />}
              />
              <Route path="*" element={<Navigate to="/workspace" replace />} />
            </>
          ) : (
            /* ===== Protected Routes (with Layout) ===== */
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
