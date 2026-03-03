import { WorkspaceRole } from '@prisma/client'

export interface CreateWorkspacePayload {
  name: string
  description?: string
  iconUrl?: string
}
// สำหรับการอัพเดต workspace เราอนุญาตให้เปลี่ยนแค่ name, description และ iconUrl เท่านั้น
export interface UpdateWorkspacePayload {
  name?: string
  description?: string
  iconUrl?: string
}
// Response ที่เราจะส่งกลับไปยัง frontend 
export interface WorkspaceResponse {
  id: string
  name: string
  description?: string
  iconUrl?: string
  ownerId: string
  inviteCode: string
  createdAt: Date
  updatedAt: Date
}
// Response สำหรับแสดงสมาชิกใน workspace พร้อมข้อมูล user เบื้องต้น
export interface WorkspaceMemberResponse {
  id: string
  userId: string
  role: WorkspaceRole
  joinedAt: Date
  user: {
    id: string
    displayName: string
    email: string
    avatarUrl?: string
  }
}
// Payload สำหรับการเชิญสมาชิกเข้าร่วม workspace ผ่าน invite code
export interface JoinWorkspacePayload {
  inviteCode: string
}
// Payload สำหรับการอัพเดต role ของสมาชิกใน workspace
export interface UpdateMemberRolePayload {
  role: WorkspaceRole
}