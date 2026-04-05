// ===== App Constants =====
// ค่าคงที่ที่ใช้ทั่วทั้งแอป

export const APP_NAME = 'TamelyChat';
export const APP_DESCRIPTION = 'AI-Powered Workspace';

// ===== Brand Colors =====
// ใช้ค่าคงที่นี้แทน hard-code สีในทุก component
export const BRAND_COLORS = {
  primary: '#003366',
  primaryHover: '#174978',
  secondary: '#2F5F8A',
  accent: '#46769B',
  teal: '#5EBCAD',
  lightBlue: '#75A2BF',
} as const;

// Workspace color palette (ใช้สำหรับ avatar workspace)
export const WORKSPACE_COLORS = [
  BRAND_COLORS.teal,
  BRAND_COLORS.accent,
  BRAND_COLORS.lightBlue,
  BRAND_COLORS.primary,
  BRAND_COLORS.secondary,
] as const;

// ===== Tailwind Gradient Classes =====
// ใช้ class เหล่านี้แทน hard-code gradient ซ้ำๆ
export const GRADIENT = {
  /** gradient จาก teal → accent (ใช้ใน AI avatar, ปุ่มหลัก) */
  tealToBlue: 'bg-gradient-to-r from-[#5EBCAD] to-[#46769B]',
  tealToBlueLinear: 'bg-linear-to-r from-[#5EBCAD] to-[#46769B]',
  /** gradient พื้นหลัง login / landing */
  darkBlue: 'bg-linear-to-br from-[#003366] via-[#174978] to-[#2F5F8A]',
  /** gradient AI message bubble */
  tealToBlueRounded: 'bg-linear-to-br from-[#5EBCAD] to-[#46769B]',
} as const;

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
