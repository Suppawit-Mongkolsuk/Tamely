// ===== Workspace Context =====
// แชร์ workspace state ทั่วทั้ง component tree

import { createContext, useContext, type ReactNode } from 'react';
import { useWorkspace } from '@/hooks';
import type {
  Workspace,
  CreateWorkspaceRequest,
  JoinWorkspaceRequest,
} from '@/types';

interface WorkspaceContextValue {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  fetchWorkspaces: () => Promise<Workspace[] | undefined>;
  selectWorkspace: (id: string) => Promise<Workspace>;
  createWorkspace: (data: CreateWorkspaceRequest) => Promise<Workspace>;
  joinWorkspace: (data: JoinWorkspaceRequest) => Promise<Workspace>;
  clearCurrentWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const ws = useWorkspace();

  return (
    <WorkspaceContext.Provider value={ws}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error(
      'useWorkspaceContext must be used within WorkspaceProvider',
    );
  }
  return context;
}
