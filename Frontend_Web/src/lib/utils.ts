// ===== Utility Functions =====
// Helper functions ที่ใช้ทั่วทั้งแอป

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** รวม Tailwind classes อย่างปลอดภัย (ใช้แทน cn ที่อยู่ใน components/ui/utils) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format date เป็น locale string */
export function formatDate(date: string | Date, locale = 'th-TH'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format time เป็น locale string */
export function formatTime(date: string | Date, locale = 'th-TH'): string {
  return new Date(date).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** ตัด text ยาวๆ */
export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

/** สร้าง initials จากชื่อ เช่น "John Doe" → "JD" */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Delay / sleep */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** สร้าง ID สำหรับ optimistic updates (ไม่ใช่ crypto-safe) */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
