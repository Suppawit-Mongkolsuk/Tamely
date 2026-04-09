// ===== RoleBadge Component =====
// แสดงยศของสมาชิกใน Workspace — ใช้ได้ทุกหน้า
// ใช้ ui/badge เป็น base เพื่อ consistency ของ style ทั้งโปรเจกต์
import { Crown, ShieldCheck, Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WorkspaceMemberRole } from '@/types';

interface RoleConfig {
  label: string;
  className: string;
  icon: React.ReactNode;
}

export const ROLE_CONFIG: Record<WorkspaceMemberRole, RoleConfig> = {
  OWNER: {
    label: 'Owner',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
    icon: <Crown className="size-3.5" />,
  },
  ADMIN: {
    label: 'Admin',
    className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
    icon: <ShieldCheck className="size-3.5" />,
  },
  MODERATOR: {
    label: 'Moderator',
    className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
    icon: <Shield className="size-3.5" />,
  },
  MEMBER: {
    label: 'Member',
    className: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100',
    icon: <User className="size-3.5" />,
  },
};

interface RoleBadgeProps {
  role: WorkspaceMemberRole;
  /** sm = เล็ก, md = ปกติ */
  size?: 'sm' | 'md';
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm',
        cfg.className,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}
