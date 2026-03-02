// ===== App Constants =====
// ค่าคงที่ที่ใช้ทั่วทั้งแอป

export const APP_NAME = 'TamelyChat';
export const APP_DESCRIPTION = 'AI-Powered Workspace';

// ===== Navigation =====
export const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: 'Home' },
  { key: 'chat-rooms', label: 'Chat Rooms', icon: 'MessageSquare' },
  { key: 'ai-chat', label: 'AI Chat', icon: 'Bot' },
  { key: 'calendar', label: 'Calendar', icon: 'Calendar' },
  { key: 'management', label: 'Management', icon: 'Users' },
  { key: 'settings', label: 'Settings', icon: 'Settings' },
] as const;

export type PageKey = (typeof NAV_ITEMS)[number]['key'];

// ===== Pagination =====
export const DEFAULT_PAGE_SIZE = 20;
export const CHAT_MESSAGE_PAGE_SIZE = 50;

// ===== File Upload =====
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf', 'text/plain'];

// ===== Date/Time =====
export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = `${DATE_FORMAT} ${TIME_FORMAT}`;
