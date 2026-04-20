import { AppError } from '../../types';
import { PERMISSIONS } from '../../types/permissions';
import { hasPermission } from '../../utils/permissions';
import { TypePayloadCreateTask, TypePayloadUpdateTask } from './task.model';
import * as taskRepository from './task.repository';

/* ======================= CREATE ======================= */

export const createTask = async (
  workspaceId: string,
  userId: string,
  data: TypePayloadCreateTask,
) => {
  const member = await taskRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  const allowed = await hasPermission(workspaceId, userId, PERMISSIONS.CREATE_TASK);
  if (!allowed) throw new AppError(403, 'Insufficient permissions');

  const parsedDate = new Date(data.date);
  if (isNaN(parsedDate.getTime())) {
    throw new AppError(400, 'Invalid task date');
  }

  return taskRepository.create(workspaceId, userId, {
    title: data.title,
    description: data.description,
    date: parsedDate,
    priority: data.priority ?? 'MEDIUM',
    assigneeId: data.assigneeId,
  });
};

/* ======================= READ ======================= */

export const getTasks = async (
  workspaceId: string,
  userId: string,
  filters: {
    month?: number;
    year?: number;
    status?: string;
    priority?: string;
  },
) => {
  const member = await taskRepository.findWorkspaceMember(workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  // ทุก role เห็นเฉพาะ task ที่ถูก assign ให้ตัวเอง
  return taskRepository.findMany(workspaceId, {
    ...filters,
    assigneeId: userId,
  });
};

/* ======================= UPDATE ======================= */

export const updateTask = async (
  taskId: string,
  userId: string,
  data: TypePayloadUpdateTask,
) => {
  const task = await taskRepository.findById(taskId); // ตรวจสอบว่า task ที่จะอัปเดตมีอยู่จริงหรือไม่
  if (!task) throw new AppError(404, 'Task not found');

  const member = await taskRepository.findWorkspaceMember(task.workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  if ( // เฉพาะผู้สร้างและผู้รับผิดชอบเดิมเท่านั้นที่สามารถเปลี่ยนผู้รับผิดชอบได้
    data.assigneeId !== undefined &&
    data.assigneeId !== task.assigneeId &&
    !(await hasPermission(task.workspaceId, userId, PERMISSIONS.ASSIGN_TASK))
  ) {
    throw new AppError(403, 'Insufficient permissions');
  }

  const updateData: Record<string, unknown> = {}; // สร้าง object สำหรับเก็บข้อมูลที่ต้องการอัปเดต โดยจะเพิ่มเฉพาะ field ที่ถูกระบุใน data เท่านั้น
  if (data.title !== undefined) updateData.title = data.title; // ถ้า data.title มีค่า (ไม่ undefined) ให้เพิ่ม title ลงใน updateData เพื่อใช้ในการอัปเดตข้อมูลในฐานข้อมูล
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) {
    const parsedDate = new Date(data.date); // แปลงค่า date ที่รับมาเป็น Date object เพื่อใช้ในการอัปเดตข้อมูลในฐานข้อมูล
    if (isNaN(parsedDate.getTime())) { // ตรวจสอบว่า date ที่แปลงมาเป็นวันที่ถูกต้องหรือไม่ ถ้าไม่ใช่จะส่ง error กลับไปยัง client ว่า date ไม่ถูกต้อง
      throw new AppError(400, 'Invalid task date');
    }
    updateData.date = parsedDate; // ถ้า date ถูกต้องก็เพิ่ม date ลงใน updateData เพื่อใช้ในการอัปเดตข้อมูลในฐานข้อมูล
  }
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;

  return taskRepository.update(taskId, updateData); // เรียกใช้ฟังก์ชัน update ใน taskRepository เพื่ออัปเดตข้อมูลของ task ในฐานข้อมูล โดยส่ง taskId และ updateData ที่เตรียมไว้ให้กับฟังก์ชันนั้น
};

/* ======================= DELETE ======================= */

export const deleteTask = async (taskId: string, userId: string) => {
  const task = await taskRepository.findById(taskId);
  if (!task) throw new AppError(404, 'Task not found');

  const member = await taskRepository.findWorkspaceMember(task.workspaceId, userId);
  if (!member) throw new AppError(403, 'You are not a member of this workspace');

  if (
    task.createdById !== userId &&
    task.assigneeId !== userId &&
    !(await hasPermission(task.workspaceId, userId, PERMISSIONS.DELETE_ANY_TASK))
  ) {
    throw new AppError(403, 'Not authorized to delete this task');
  }

  await taskRepository.remove(taskId); //   เรียกใช้ฟังก์ชัน remove ใน taskRepository เพื่อทำการลบ task ออกจากฐานข้อมูล โดยส่ง taskId ของ task ที่ต้องการลบให้กับฟังก์ชันนั้น
};
