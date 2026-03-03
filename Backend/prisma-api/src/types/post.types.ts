

export interface CreatePostPayload { // Payload สำหรับการสร้างโพสต์ใหม่
  workspaceId: string
  title: string
  body: string
}
// Payload สำหรับการอัพเดตโพสต์
export interface UpdatePostPayload {
  title?: string
  body?: string
}
// Response สำหรับแสดงข้อมูลโพสต์ในหน้า feed หรือรายละเอียดโพสต์
export interface PostResponse {
  id: string
  workspaceId: string
  title: string
  body: string
  isPinned: boolean
  author: {
    id: string
    displayName: string
    avatarUrl?: string
  }
  commentCount: number
  createdAt: Date
  updatedAt: Date
}
// Response สำหรับแสดงรายละเอียดโพสต์พร้อมคอมเมนต์
export interface PostDetailResponse extends PostResponse {
  comments: {
    id: string
    content: string
    author: {
      id: string
      displayName: string
      avatarUrl?: string
    }
    createdAt: Date
  }[]
}
//  Payload สำหรับการสร้างคอมเมนต์ใหม่ในโพสต์
export interface CreateCommentPayload {
  content: string
}
// Payload สำหรับการปักหมุดหรือยกเลิกการปักหมุดโพสต์
export interface PinPostPayload {
  isPinned: boolean
}