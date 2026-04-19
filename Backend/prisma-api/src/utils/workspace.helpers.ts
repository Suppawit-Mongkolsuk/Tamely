import { prisma } from '../index';
import { AppError } from '../types';

export const getWorkspaceMember = async (workspaceId: string, userId: string) => { // ดึงข้อมูลสมาชิกใน workspace ตาม workspaceId และ userId
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { userId: true, role: true }, // ดึงเเค่ 2 ค่า
  });
};

export const assertWorkspaceActive = async (workspaceId: string) => { // ตรวจสอบว่า workspace ยัง active อยู่หรือไม่
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, isActive: true },
  });

  if (!workspace) {
    throw new AppError(404, 'Workspace not found');
  }

  if (!workspace.isActive) {
    throw new AppError(423, 'Workspace is currently blocked by admin');
  }

  return workspace;
};

export const assertWorkspaceMember = async (workspaceId: string, userId: string) => { // รวมฟังก์ชันตรวจสอบว่า workspace ยัง active อยู่หรือไม่ และตรวจสอบว่าสมาชิกเป็นสมาชิกของ workspace หรือไม่
  const member = await getWorkspaceMember(workspaceId, userId); // ดึงข้อมูลสมาชิกใน workspace ตาม workspaceId และ userId
  if (!member) {
    throw new AppError(403, 'You are not a member of this workspace');
  }
  await assertWorkspaceActive(workspaceId); // ตรวจสอบว่า workspace ยัง active อยู่หรือไม่
  return member; // คืนข้อมูลสมาชิกถ้าผ่านการตรวจสอบทั้งหมด
};
