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
  const setCurrentWorkspace = useCallback((ws: Workspace | null) => { // ฟังก์ชันนี้จะถูกใช้เพื่ออัพเดต workspace ที่กำลังใช้งานอยู่ และจะเก็บ id ของ workspace นั้นใน localStorage ด้วย เพื่อให้สามารถ restore ได้เมื่อเปิดแอปครั้งต่อไป
    setCurrentWorkspaceState(ws);
    if (ws) {
      localStorage.setItem(STORAGE_KEY, ws.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Restore workspace จาก localStorage เมื่อเปิดแอปครั้งแรก
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY); // ดึง id ของ workspace ที่เคยใช้งานล่าสุดจาก localStorage มา
    if (!savedId) { // ถ้าไม่มี id ใน localStorage แปลว่าไม่มี workspace ที่เคยใช้งาน → ไม่ต้องรออะไร
      // ไม่มี saved workspace → พร้อมทันที
      setIsWorkspaceReady(true);
      return;
    }

    workspaceService.getById(savedId) // เรียกตาม id
      .then((ws) => { // ถ้าเจอ workspace → ตั้งเป็น current workspace
        setCurrentWorkspaceState(ws); // ตั้งตรงนี้เลยเพื่อไม่ต้องรอ fetchWorkspaces ซึ่งอาจจะยังไม่เสร็จ
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
      const data = await workspaceService.getAll(); // เรียก API เพื่อดึง workspace ทั้งหมดที่ผู้ใช้เป็นสมาชิกอยู่
      setWorkspaces(data);// เก็บไว้ใน state เพื่อให้ component อื่นๆ ที่ใช้ hook นี้สามารถเข้าถึงได้
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectWorkspace = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const ws = await workspaceService.getById(id); // เรียก API เพื่อดึงข้อมูล workspace ที่ถูกเลือกมา (อาจจะมีข้อมูลเพิ่มเติม เช่น รายชื่อสมาชิก สิทธิ์ของผู้ใช้ใน workspace นั้นๆ เป็นต้น)
      setCurrentWorkspace(ws);
      return ws;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentWorkspace]);

  const createWorkspace = useCallback(async (data: CreateWorkspaceRequest) => {
    const ws = await workspaceService.create(data); // เรียก API เพื่อสร้าง workspace ใหม่ด้วยข้อมูลที่ผู้ใช้กรอกมา (เช่น ชื่อ workspace คำอธิบาย เป็นต้น)
    setWorkspaces((prev) => [...prev, ws]);
    return ws;
  }, []);

  const joinWorkspace = useCallback(async (data: JoinWorkspaceRequest) => {
    const ws = await workspaceService.join(data); // เรียก API เพื่อเข้าร่วม workspace ด้วยข้อมูลที่ผู้ใช้กรอกมา (เช่น รหัสเชิญ)
    setWorkspaces((prev) => [...prev, ws]); // เพิ่ม workspace ที่เข้าร่วมสำเร็จลงใน state
    return ws;
  }, []);

  const clearCurrentWorkspace = useCallback(() => {
    setCurrentWorkspace(null); // เคลียร์ workspace ที่กำลังใช้งานอยู่ (เช่น เมื่อผู้ใช้ logout หรือออกจาก workspace)
  }, [setCurrentWorkspace]);

  const updateCurrentWorkspace = useCallback((ws: Workspace) => {
    setCurrentWorkspace(ws); // อัพเดตข้อมูล workspace ที่กำลังใช้งานอยู่ (เช่น เมื่อมีการแก้ไขชื่อ workspace หรือคำอธิบาย เป็นต้น)
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
