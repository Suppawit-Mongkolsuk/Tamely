// ===== useWorkspace Hook =====
// จัดการ workspace state

import { useState, useCallback } from 'react';
import { workspaceService } from '@/services';
import type { Workspace, CreateWorkspaceRequest, JoinWorkspaceRequest } from '@/types';

export function useWorkspace() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await workspaceService.getAll();
      setWorkspaces(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectWorkspace = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const ws = await workspaceService.getById(id);
      setCurrentWorkspace(ws);
      return ws;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createWorkspace = useCallback(async (data: CreateWorkspaceRequest) => {
    const ws = await workspaceService.create(data);
    setWorkspaces((prev) => [...prev, ws]);
    return ws;
  }, []);

  const joinWorkspace = useCallback(async (data: JoinWorkspaceRequest) => {
    const ws = await workspaceService.join(data);
    setWorkspaces((prev) => [...prev, ws]);
    return ws;
  }, []);

  const clearCurrentWorkspace = useCallback(() => {
    setCurrentWorkspace(null);
  }, []);

  return {
    workspaces,
    currentWorkspace,
    isLoading,
    fetchWorkspaces,
    selectWorkspace,
    createWorkspace,
    joinWorkspace,
    clearCurrentWorkspace,
  };
}
