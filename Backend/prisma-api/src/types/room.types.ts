
// Payload สำหรับการสร้างห้องแชทใหม่
export interface CreateRoomPayload {
  name: string
  description?: string
  isPrivate?: boolean
}
// Payload สำหรับการอัพเดตห้องแชท 
export interface UpdateRoomPayload {
  name?: string
  description?: string
  isPrivate?: boolean
}
// Response สำหรับแสดงข้อมูลห้องแชทในหน้า list หรือรายละเอียดห้องแชท
export interface RoomResponse {
  id: string
  workspaceId: string
  name: string
  description?: string
  isPrivate: boolean
  createdById: string
  memberCount: number
  createdAt: Date
  updatedAt: Date
}
// Response สำหรับแสดงรายละเอียดห้องแชทพร้อมสมาชิก
export interface RoomDetailResponse extends RoomResponse {
  members: {
    id: string
    displayName: string
    avatarUrl?: string
  }[]
}
// Payload สำหรับการเชิญสมาชิกเข้าร่วมห้องแชท
export interface JoinRoomPayload {
  userId: string
}