import { MessageType } from '@prisma/client'

export interface SendMessagePayload { // Payload สำหรับส่งข้อความในห้องแชท
  roomId: string
  content: string
  type?: MessageType
}
// Response ที่เราจะส่งกลับไปยัง frontend หลังจากส่งข้อความสำเร็จ
export interface MessageResponse {
  id: string
  roomId: string
  senderId: string
  content: string
  type: MessageType
  createdAt: Date
  sender: {
    id: string
    displayName: string
    avatarUrl?: string
  }
}
// Query parameters สำหรับดึงประวัติข้อความในห้องแชท
export interface MessageHistoryQuery {
  limit?: number
  offset?: number
  before?: Date
}