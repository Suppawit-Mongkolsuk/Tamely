// ===== ProtectedRoute =====
// ตรวจสอบ auth + workspace ก่อนแสดงหน้าที่ต้องการ login

import { Navigate, useSearchParams } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuthContext } from '@/contexts/AuthContext';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { canAny, PERMISSIONS } from '@/lib/permissions';

const LandingPage = lazy(() =>
  import('@/Pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/Pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('@/Pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);

// ── Guard: ต้อง login แล้ว ──────────────────────────────────────────────────
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionReady } = useAuthContext();
  const { isWorkspaceReady } = useWorkspaceContext();

  if (!isSessionReady || (isAuthenticated && !isWorkspaceReady)) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ── Guard: ต้อง login + มี workspace แล้ว ────────────────────────────────────
export function RequireWorkspace({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionReady } = useAuthContext();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

  if (!isSessionReady || (isAuthenticated && !isWorkspaceReady)) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!currentWorkspace) return <Navigate to="/workspace" replace />;
  return <>{children}</>;
}

export function RequireManagementAccess({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionReady } = useAuthContext();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

  if (!isSessionReady || (isAuthenticated && !isWorkspaceReady)) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!currentWorkspace) return <Navigate to="/workspace" replace />;
  if (
    !canAny(currentWorkspace, [
      PERMISSIONS.MANAGE_MEMBERS,
      PERMISSIONS.MANAGE_CHANNELS,
      PERMISSIONS.MANAGE_WORKSPACE,
      PERMISSIONS.MANAGE_ROLES,
    ])
  ) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}

// ── Guard: ถ้า login แล้ว ไม่ให้เข้าหน้า /login อีก ─────────────────────────
export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionReady } = useAuthContext();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

  if (!isSessionReady || (isAuthenticated && !isWorkspaceReady)) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (isAuthenticated && currentWorkspace) return <Navigate to="/home" replace />;
  if (isAuthenticated && !currentWorkspace) return <Navigate to="/workspace" replace />;
  return <>{children}</>;
}
