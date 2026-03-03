import { TaskPriority, TaskStatus, TaskCreator } from '@prisma/client'
//  Payload สำหรับการสร้าง task ใหม่
export interface CreateTaskPayload {
  workspaceId: string
  title: string
  description?: string
  date: Date
  priority?: TaskPriority
  assigneeId?: string
}
// Payload สำหรับการอัพเดต task
export interface UpdateTaskPayload {
  title?: string
  description?: string
  date?: Date
  priority?: TaskPriority
  status?: TaskStatus
  assigneeId?: string
}
// Response สำหรับแสดงข้อมูล task ในหน้า list หรือรายละเอียด task
export interface TaskResponse {
  id: string
  workspaceId: string
  title: string
  description?: string
  date: Date
  priority: TaskPriority
  status: TaskStatus
  createdBy: TaskCreator
  assignee?: {
    id: string
    displayName: string
    avatarUrl?: string
  }
  creator: {
    id: string
    displayName: string
  }
  createdAt: Date
  updatedAt: Date
}
// Query parameters สำหรับดึงรายการ task ใน workspace
export interface GetTasksQuery {
  workspaceId: string
  month?: number  
  year?: number
  status?: TaskStatus
  priority?: TaskPriority
}
// Payload สำหรับการสร้าง task โดยใช้ AI
export interface AiCreateTaskPayload {
  workspaceId: string
  prompt: string  
}