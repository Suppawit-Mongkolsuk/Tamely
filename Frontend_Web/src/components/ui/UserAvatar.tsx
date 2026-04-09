// ===== UserAvatar — shared avatar with initials fallback =====
// ใช้ Radix Avatar primitives ภายใน
// รองรับ avatarUrl (รูปภาพ) และ initials fallback พร้อม size presets

import { cn } from './utils';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface UserAvatarProps {
  displayName: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-xl',
};

/** สร้าง initials จาก displayName (สูงสุด 2 ตัวอักษร) */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * UserAvatar — แสดง avatar รูปภาพ หรือ initials ของผู้ใช้
 *
 * ใช้ Radix Avatar primitives ภายใน รองรับ accessibility ครบถ้วน
 *
 * @example
 * <UserAvatar displayName="John Doe" size="md" />
 * <UserAvatar displayName="John Doe" avatarUrl={user.avatarUrl} size="lg" />
 */
export function UserAvatar({
  displayName,
  avatarUrl,
  size = 'md',
  className,
}: UserAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];

  return (
    <Avatar className={cn(sizeClass, className)}>
      {avatarUrl && (
        <AvatarImage src={avatarUrl} alt={displayName} />
      )}
      <AvatarFallback
        className="bg-[#5EBCAD] text-white font-semibold select-none"
      >
        {getInitials(displayName)}
      </AvatarFallback>
    </Avatar>
  );
}
