import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// ===== Lazy-loaded Pages (code-splitting) =====
const LoginRegisterPage = lazy(() =>
  import('./pages/LoginRegisterPage').then((m) => ({
    default: m.LoginRegisterPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const ChatRoomsPage = lazy(() =>
  import('./pages/ChatRoomsPage').then((m) => ({ default: m.ChatRoomsPage })),
);
const AIChatPage = lazy(() =>
  import('./pages/AIChatPage').then((m) => ({ default: m.AIChatPage })),
);
const CalendarPage = lazy(() =>
  import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
);
const ManagementPage = lazy(() =>
  import('./pages/ManagementPage').then((m) => ({ default: m.ManagementPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [hasJoinedWorkspace, setHasJoinedWorkspace] = useState(() => {
    return localStorage.getItem('hasJoinedWorkspace') === 'true';
  });

  const navigate = useNavigate();

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    navigate('/workspace');
  };

  const handleJoinWorkspace = () => {
    setHasJoinedWorkspace(true);
    localStorage.setItem('hasJoinedWorkspace', 'true');
    navigate('/home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setHasJoinedWorkspace(false);
    localStorage.removeItem('isLoggedIn');
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
          {!isLoggedIn ? (
            <>
              <Route
                path="/login"
                element={
                  <LoginRegisterPage
                    onComplete={handleLogin}
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
