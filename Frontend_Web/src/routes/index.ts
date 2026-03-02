// ===== Route Configuration =====
// กำหนด route paths ทั้งหมดสำหรับ React Router

export const ROUTES = {
  // Public routes (ไม่ต้อง login)
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',

  // Workspace selection (login แล้ว แต่ยังไม่เลือก workspace)
  WORKSPACE: '/workspace',

  // Protected routes (login + มี workspace แล้ว)
  HOME: '/home',
  CHAT_ROOMS: '/chat-rooms',
  AI_CHAT: '/ai-chat',
  CALENDAR: '/calendar',
  MANAGEMENT: '/management',
  SETTINGS: '/settings',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

// Public routes ที่ไม่ต้อง auth
export const PUBLIC_ROUTES: RoutePath[] = [
  ROUTES.LOGIN,
  ROUTES.FORGOT_PASSWORD,
];

export function isPublicRoute(path: string): boolean {
  return (PUBLIC_ROUTES as string[]).includes(path);
}
