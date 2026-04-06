// ===== useWorkspace Hook =====
// จัดการ workspace state

import { useState, useCallback, useEffect } from 'react';
import { workspaceService } from '@/services';
import type { Workspace, CreateWorkspaceRequest, JoinWorkspaceRequest } from '@/types';

const STORAGE_KEY = 'tamely_current_workspace_id';

export function useWorkspace() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // true = restore จาก localStorage เสร็จแล้ว (ไม่ว่าจะเจอ workspace หรือเปล่า)
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);

  // Persist workspace id ใน localStorage
  const setCurrentWorkspace = useCallback((ws: Workspace | null) => {
    setCurrentWorkspaceState(ws);
    if (ws) {
      localStorage.setItem(STORAGE_KEY, ws.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Restore workspace จาก localStorage เมื่อเปิดแอปครั้งแรก
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId) {
      // ไม่มี saved workspace → พร้อมทันที
      setIsWorkspaceReady(true);
      return;
    }

    workspaceService.getById(savedId)
      .then((ws) => {
        setCurrentWorkspaceState(ws);
      })
      .catch(() => {
        // workspace ไม่มีแล้ว (ถูกลบ หรือไม่ได้เป็นสมาชิก) → เคลียร์ออก
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => {
        setIsWorkspaceReady(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  }, [setCurrentWorkspace]);

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
  }, [setCurrentWorkspace]);

  const updateCurrentWorkspace = useCallback((ws: Workspace) => {
    setCurrentWorkspace(ws);
  }, [setCurrentWorkspace]);

  return {
    workspaces,
    currentWorkspace,
    isLoading,
    isWorkspaceReady,
    fetchWorkspaces,
    selectWorkspace,
    createWorkspace,
    joinWorkspace,
    clearCurrentWorkspace,
    updateCurrentWorkspace,
  };
}
